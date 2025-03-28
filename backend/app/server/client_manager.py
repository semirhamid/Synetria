import asyncio
import threading

import zmq
import zmq.asyncio

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

import logging
from typing import List, Dict, Any

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("client_manager")


class ClientManager:
    def __init__(
        self,
        server_host: str = "localhost",
        server_port: int = 8000,
        zmq_endpoint: str = "tcp://127.0.0.1:5555",
    ):
        # # ZeroMQ setup
        self.zmq_endpoint = zmq_endpoint

        # FastAPI server settings
        self.server_host = server_host
        self.server_port = server_port

        # Message queue for received data
        self.queue = asyncio.Queue()

        # Create FastAPI app
        self.app = FastAPI()
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        # Set up routes
        self.setup_server_routes()

    def setup_server_routes(self):
        """Set up API routes for the FastAPI server."""

        @self.app.get("/")
        async def root():
            return {"message": "Synetria Training Server"}

        @self.app.get("/stream")
        async def stream_updates(request: Request):
            """SSE endpoint to stream training updates to clients."""

            async def event_generator():
                client_id = id(request)
                logger.info(f"New client connected: {client_id}")

                # Send headers for SSE
                yield 'data: {"status": "connected"}\n\n'

                try:
                    while True:
                        message = await self.queue.get()

                        # Format as SSE event
                        yield f"data: {message}\n\n"

                        # Mark task as done
                        self.queue.task_done()
                except Exception as e:
                    logger.error(f"Error streaming to client {client_id}: {e}")
                finally:
                    logger.info(f"Client disconnected: {client_id}")

            return StreamingResponse(
                event_generator(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no",
                },
            )

    def start_zmq_subscriber(self):
        """Run ZeroMQ subscriber in a separate thread."""

        async def zmq_listener():
            # Create asyncio ZMQ context for async operations
            asyncio_context = zmq.asyncio.Context()
            subscriber = asyncio_context.socket(zmq.SUB)
            subscriber.connect(self.zmq_endpoint)
            subscriber.setsockopt_string(zmq.SUBSCRIBE, "")

            logger.info("ZeroMQ subscriber started")

            while True:
                try:
                    message = await subscriber.recv()
                    message_str = message.decode("utf-8")
                    # logger.info(f"Received update from trainer")

                    await self.queue.put(message_str)
                except Exception as e:
                    logger.error(f"Error in ZMQ subscriber: {e}")
                    await asyncio.sleep(0.2)  # Wait a bit before retrying

        # Create event loop in new thread
        def run_async_loop():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(zmq_listener())

        thread = threading.Thread(target=run_async_loop, daemon=True)
        thread.start()
        logger.info("ZeroMQ subscriber thread started")

    def start(self):
        """Start the client manager."""
        logger.info(f"Starting client manager on {self.server_host}:{self.server_port}")

        # Start ZeroMQ subscriber
        self.start_zmq_subscriber()
        # Start FastAPI server
        uvicorn.run(self.app, host=self.server_host, port=self.server_port)


def main():
    """Test function to run the client manager standalone."""
    client_manager = ClientManager()
    client_manager.start()


if __name__ == "__main__":
    main()
