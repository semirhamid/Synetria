from torch.utils.data import DataLoader
import torch.nn as nn
import multiprocessing
import zmq
import asyncio
import logging
from app.training.trainer import Trainer
from app.server.client_manager import ClientManager

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("training_manager")


def run_trainer(model, data_loader, criterion, optimizer, num_epochs, zmq_port=5555):
    """Function to run in a separate process for training the model."""

    async def train():
        trainer = Trainer(port=zmq_port)
        await trainer.train(
            model=model,
            data_loader=data_loader,
            criterion=criterion,
            optimizer=optimizer,
            num_epochs=num_epochs,
        )

    # Run the training in the asyncio event loop
    try:
        asyncio.run(train())
    except RuntimeError:
        # Handle case when there's already an event loop running
        loop = asyncio.get_event_loop()
        loop.run_until_complete(train())


class TrainingManager:
    def __init__(
        self,
        server_host: str = "localhost",
        server_port: int = 8000,
        zmq_port: int = 5555,
    ):
        self.server_host = server_host
        self.server_port = server_port
        self.zmq_port = zmq_port
        self.trainer_process = None
        self.client_manager_process = None

    async def start_training(
        self,
        model: nn.Module,
        data_loader: DataLoader,
        criterion,
        optimizer,
        num_epochs: int,
    ):
        """Start the training process and client manager in separate processes."""
        logger.info("Starting training manager...")

        # Start client manager in a separate process
        logger.info("Starting client manager process...")
        self.client_manager_process = multiprocessing.Process(
            target=self._start_client_manager,
            name="ClientManager",
            args=(self.server_host, self.server_port, self.zmq_port),
        )

        self.client_manager_process.start()
        logger.info("Client manager process started")

        # Allow time for client manager to initialize
        await asyncio.sleep(1)

        # Start trainer in a separate process
        logger.info("Starting trainer process...")
        self.trainer_process = multiprocessing.Process(
            target=run_trainer,
            name="Trainer",
            args=(model, data_loader, criterion, optimizer, num_epochs, self.zmq_port),
        )
        self.trainer_process.start()
        logger.info("Trainer process started")

        # Wait for training to complete
        while self.trainer_process.is_alive():
            await asyncio.sleep(0.5)

        logger.info("Training process completed")

    def _start_client_manager(self, host, port, zmq_port):
        """Start the client manager to handle SSE connections."""
        zmq_endpoint = f"tcp://127.0.0.1:{zmq_port}"
        client_manager = ClientManager(
            server_host=host, server_port=port, zmq_endpoint=zmq_endpoint
        )
        client_manager.start()

    def stop(self):
        """Stop all processes."""
        if self.trainer_process and self.trainer_process.is_alive():
            logger.info("Stopping trainer process...")

            self.trainer_process.terminate()
            self.trainer_process.join(timeout=5)

            logger.info("Trainer process stopped")

        if self.client_manager_process and self.client_manager_process.is_alive():
            logger.info("Stopping client manager process...")

            self.client_manager_process.terminate()
            self.client_manager_process.join(timeout=5)

            logger.info("Client manager process stopped")
