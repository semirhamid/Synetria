import torch
from torch.utils.data import DataLoader, TensorDataset
from app.training.trainer import Trainer
from app.models.simple_nn import SimpleNN
from app.models.cnn import SimpleCNN, LeNetBasedModel
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms


async def handle_client(websocket):
    print("Client connected!")

    train_loader, model = load_cnn_example()
    # train_loader, model = load_mlp_example()

    # criterion = nn.MSELoss()
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)

    # Start training after client connects
    trainer = Trainer()
    await trainer.train(model, train_loader, criterion, optimizer, websocket)


def load_mlp_example():
    # Example dataset
    inputs = torch.randn(100, 3)
    targets = torch.randint(0, 2, (100, 2)).float()

    # Initialize model, criterion, and optimizer
    model = SimpleNN()

    dataset = TensorDataset(inputs, targets)
    train_loader = DataLoader(dataset, batch_size=10, shuffle=True)

    return train_loader, model


def load_cnn_example():
    print("loading cnn example...")
    # Define a transform to normalize the data
    # transform = transforms.Compose(
    #     [
    #         transforms.ToTensor(),
    #         transforms.Normalize((0.5,), (0.5,)),  # Normalize to [-1, 1]
    #     ]
    # )

    transform = transforms.Compose([
            transforms.Resize(size=(32, 32)),
            transforms.Grayscale(num_output_channels=3),
            transforms.ToTensor()
        ])

    # Load the MNIST dataset
    mnist_dataset = datasets.MNIST(
        root="./data", train=True, download=True, transform=transform
    )

    # Prepare inputs and targets
    # inputs = mnist_dataset.data.float().unsqueeze(1)  # Add chxannel dimension
    # targets = nn.functional.one_hot(
        # mnist_dataset.targets, num_classes=len(mnist_dataset.classes)
    # ).float()  # One-hot encode targets

    # inputs = inputs[:10000]
    # targets = targets[:10000]

    # print("inputs: ", len(inputs))

    model = LeNetBasedModel()
    # model = LenetBasedCNN(in_channels=1, num_classes=len(mnist_dataset.classes))

    # dataset = TensorDataset(inputs, targets)
    train_loader = DataLoader(mnist_dataset, batch_size=64, shuffle=True)

    return train_loader, model
