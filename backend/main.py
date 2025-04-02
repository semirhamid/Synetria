import asyncio

import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader, TensorDataset

import argparse
import logging

from app.server.training_manager import TrainingManager
from app.models.simple_nn import SimpleNN
from app.models.cnn import SimpleCNN, LeNetBasedModel, VGGInspiredCNN

# Set up logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("main")


async def main(
    server_host="localhost", server_port=8000, zmq_port=5555, model_type="cnn"
):
    """
    Main entry point for the Synetria backend.

    Starts a training manager that:
    1. Launches a client manager in a separate process for handling SSE connections
    2. Launches a trainer in a separate process for model training
    3. Uses ZeroMQ for inter-process communication

    Args:
        server_host (str): Host for the client manager's FastAPI server
        server_port (int): Port for the client manager's FastAPI server
        zmq_port (int): Port for ZeroMQ communication
        model_type (str): Type of model to train ('cnn' or 'mlp')
    """
    logger.info(
        f"Starting Synetria backend on {server_host}:{server_port}, ZMQ port: {zmq_port}"
    )

    if model_type == "mlp":
        train_loader, model = load_mlp_example()
    else:
        train_loader, model = load_cnn_example()

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)

    # Create and start training manager
    training_manager = TrainingManager(
        server_host=server_host, server_port=server_port, zmq_port=zmq_port
    )

    try:
        await training_manager.start_training(
            model=model,
            data_loader=train_loader,
            criterion=criterion,
            optimizer=optimizer,
            num_epochs=20,
        )
    except KeyboardInterrupt:
        logger.info("Training interrupted by user")
    finally:
        # Clean up resources
        training_manager.stop()


def load_mlp_example():
    """Load a simple MLP example with synthetic data."""
    logger.info("Loading MLP example with synthetic data")
    inputs = torch.randn(100, 3)
    targets = torch.randint(0, 2, (100, 2)).float()

    model = SimpleNN()

    dataset = TensorDataset(inputs, targets)
    train_loader = DataLoader(dataset, batch_size=10, shuffle=True)

    return train_loader, model


def load_cnn_example():
    """Load a CNN example with MNIST data."""
    logger.info("Loading CNN example with MNIST data")
    transform = transforms.Compose(
        [
            transforms.Resize(size=(32, 32)),
            transforms.Grayscale(num_output_channels=3),
            transforms.ToTensor(),
        ]
    )
    # hello world, watup. hello world, whatup, hello baby guess who back, i know you miss me.
    # Data
    data = datasets.MNIST(root="./data", train=True, download=True, transform=transform)
    # data = datasets.CIFAR10(root="./data", train=True, download=True, transform=transform)

    # Models
    model = LeNetBasedModel(in_channels=3, num_classes=len(data.classes))
    # model = VGGInspiredCNN(in_channels=3, num_classes=len(data.classes))
    
    # model = models.resnet18(pretrained=True)
    # model.fc = torch.nn.Linear(model.fc.in_features, len(data.classes))

    logger.info(f"Model created: {model.__class__.__name__}")

    train_loader = DataLoader(data, batch_size=64, shuffle=True)
    return train_loader, model


if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(
        description="Synetria Neural Network Visualization Backend"
    )
    parser.add_argument("--host", type=str, default="localhost", help="Server host")
    parser.add_argument("--port", type=int, default=8000, help="Server port")
    parser.add_argument("--zmq-port", type=int, default=5555, help="ZeroMQ port")
    parser.add_argument(
        "--model",
        type=str,
        default="cnn",
        choices=["cnn", "mlp"],
        help="Model type to train",
    )
    args = parser.parse_args()

    # Run main function with provided arguments
    try:
        asyncio.run(
            main(
                server_host=args.host,
                server_port=args.port,
                zmq_port=args.zmq_port,
                model_type=args.model,
            )
        )
    except RuntimeError as e:
        logger.error(f"Runtime error: {e}")
        # Fallback for when there's already an event loop running
        loop = asyncio.get_event_loop()
        try:
            loop.run_until_complete(
                main(
                    server_host=args.host,
                    server_port=args.port,
                    zmq_port=args.zmq_port,
                    model_type=args.model,
                )
            )
        except Exception as e:
            logger.error(f"Error in asyncio loop: {e}")
        finally:
            loop.close()
