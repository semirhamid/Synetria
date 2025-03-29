import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

import json
import ujson
import zmq

import logging
import asyncio  # added for asynchronous offloading
from typing import Dict, List, Any, Tuple

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("trainer")


class Trainer:
    def __init__(self, port: int = 5555):
        """
        Initialize the trainer with ZeroMQ publisher.

        Args:
            port (int): ZeroMQ publisher port
        """
        self.port = port

        self.context = zmq.Context()
        self.publisher = self.context.socket(zmq.PUB)
        zmq_endpoint = f"tcp://127.0.0.1:{port}"
        self.publisher.bind(zmq_endpoint)
        self.publisher.setsockopt(
            zmq.SNDHWM, 1
        )  # added to lower the send high-water mark
        logger.info(f"Trainer initialized, ZeroMQ publisher bound to {zmq_endpoint}")

        self.hooks = []
        self.activations = {}
        self.gradients = {}

    async def train(
        self,
        model: nn.Module,
        data_loader: DataLoader,
        criterion,
        optimizer,
        num_epochs: int = 5,
    ):
        """
        Main training method that coordinates the training process and sends data via ZeroMQ.
        """
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = model.to(device)
        logger.info(f"Training on device: {device}")

        self.model = model
        self.data_loader = data_loader
        self.criterion = criterion
        self.optimizer = optimizer
        self.num_epochs = num_epochs

        # Register hooks for capturing activations and gradients
        self._register_forward_hooks()
        self._register_backward_hooks()

        self.model_structure = self._get_model_structure()
        self.conv_layers = [
            name
            for name, module in self.model.named_modules()
            if isinstance(module, nn.Conv2d)
        ]

        # Training loop
        for epoch in range(self.num_epochs):
            for batch_idx, (inputs, targets) in enumerate(self.data_loader):
                inputs, targets = inputs.to(device), targets.to(device)

                self.optimizer.zero_grad()
                outputs = self.model(inputs)

                loss = self.criterion(outputs, targets)
                loss.backward()
                self.optimizer.step()

                if batch_idx % 100 == 0:
                    logger.info(
                        f"Train Epoch: {epoch+1}/{self.num_epochs}"
                        + f"[{batch_idx * len(inputs)}/{len(data_loader.dataset)}"
                        + f"({100. * batch_idx / len(data_loader):.0f}%)]\tLoss: {loss.item():.6f}"
                    )
                    await self._send_training_data(
                        epoch, loss, batch_idx, len(inputs), inputs[0]
                    )

                self.activations.clear()
                self.gradients.clear()

                # Small delay to prevent overwhelming the system
                # await asyncio.sleep(0.001)

        self._remove_hooks()

    async def _send_training_data(
        self,
        epoch: int,
        loss: float,
        batch_idx: int,
        batch_size: int,
        input: torch.Tensor,
    ) -> None:
        """
        Prepare and send training data via ZeroMQ.
        """

        training_data = {
            "parameters": {
                "total_epochs": self.num_epochs,
                "learning_rate": self.optimizer.param_groups[0]["lr"],
                "total_batches": len(self.data_loader),
                "batch_size": batch_size,
            },
            "metadata": {
                "epoch": epoch + 1,  # 1-indexed
                "batch": batch_idx + 1,  # 1-indexed
                "loss": loss.item(),
            },
            "model_structure": self.model_structure,
            "network_input": self._prepare_input_data(input),
            "layers": [],
        }

        cams = self._get_gradcam_activations(self.conv_layers)
        self._add_layer_data(self.activations, training_data, cams)
        try:  # Send data via ZeroMQ without blocking the main thread
            await asyncio.to_thread(self._transmit_data, training_data)  # changed code
        except Exception as e:
            logger.error(f"Error sending data via ZeroMQ: {e}")

    def _prepare_input_data(self, input_tensor: torch.Tensor) -> Dict[str, Any]:
        """Prepares input data for visualization."""
        if input_tensor.ndim > 1:  # Image data
            # Convert to numpy with proper channel ordering and avoid unnecessary copies
            input_np = input_tensor.detach().cpu().numpy()
            if input_np.ndim == 3:  # CHW format
                input_np = np.transpose(input_np, (1, 2, 0))  # Convert to HWC

            return {
                "type": "image",
                "data": input_np.tolist(),  # Just one conversion to list at the end
            }
        else:
            return {
                "type": "vector",
                "data": input_tensor.detach().cpu().numpy().reshape(1, 1, -1).tolist(),
            }

    def _register_backward_hooks(self) -> None:
        """Register backward hooks to capture gradients."""

        def get_gradient(name):
            def hook(module, grad_in, grad_out):
                self.gradients[name] = grad_out[0].detach()

            return hook

        for name, module in self.model.named_modules():
            if isinstance(module, nn.Conv2d):
                self.hooks.append(
                    module.register_full_backward_hook(get_gradient(name))
                )

    def _register_forward_hooks(self) -> None:
        """Register forward hooks to capture activations."""

        def get_activation(name):
            def hook(module, input, output):
                self.activations[name] = output.detach()

            return hook

        for name, module in self.model.named_modules():
            if isinstance(module, (nn.Conv2d, nn.MaxPool2d, nn.AvgPool2d, nn.Linear)):
                self.hooks.append(module.register_forward_hook(get_activation(name)))

    def _remove_hooks(self) -> None:
        """Remove all registered hooks."""
        for hook in self.hooks:
            hook.remove()
        self.hooks.clear()

    def _get_model_structure(self) -> Dict[str, Any]:
        """
        Extract and return the model structure metadata.
        """
        model_structure = {
            "total_layers": len(list(self.model.modules())),
            "total_params": sum(p.numel() for p in self.model.parameters()),
            "layer_details": [],
        }

        for name, layer in self.model.named_modules():
            if isinstance(layer, nn.Conv2d):
                model_structure["layer_details"].append(
                    {
                        "layer_name": name,
                        "layer_type": "conv",
                        "input_size": [
                            layer.in_channels,
                            layer.kernel_size[0],
                            layer.kernel_size[1],
                        ],
                        "output_size": [
                            layer.out_channels,
                            layer.kernel_size[0],
                            layer.kernel_size[1],
                        ],
                    }
                )
            elif isinstance(layer, nn.MaxPool2d) or isinstance(layer, nn.AvgPool2d):
                pool_type = "max" if isinstance(layer, nn.MaxPool2d) else "avg"
                kernel_size = (
                    layer.kernel_size
                    if isinstance(layer.kernel_size, int)
                    else layer.kernel_size[0]
                )
                model_structure["layer_details"].append(
                    {
                        "layer_name": name,
                        "layer_type": "pool",
                        "pool_type": pool_type,
                        "input_size": [0, kernel_size],
                        "output_size": [0, kernel_size],
                    }
                )
            elif isinstance(layer, nn.Linear):
                model_structure["layer_details"].append(
                    {
                        "layer_name": name,
                        "layer_type": "linear",
                        "input_size": layer.in_features,
                        "output_size": layer.out_features,
                    }
                )

        return model_structure

    def _get_gradcam_activations(self, conv_layers):
        """
        Calculate GradCAM activations for convolutional layers.
        Implementation follows the GradCAM paper (https://arxiv.org/abs/1610.02391).
        """
        cams = {}

        for layer in conv_layers:
            if layer not in self.activations or layer not in self.gradients:
                continue

            # Get activation and gradient for the layer
            activation = self.activations[layer][0].detach()  # Get first batch item
            gradient = self.gradients[layer][0].detach()

            # Calculate weights by global average pooling of gradients
            weights = gradient.mean(dim=(1, 2), keepdim=True)

            # Compute weighted activation and apply ReLU
            cam = torch.relu((weights * activation).sum(dim=0))

            # Normalize to [0, 1] range
            if cam.max() != cam.min():  # Avoid division by zero
                cam = (cam - cam.min()) / (cam.max() - cam.min())

            # Convert to numpy for serialization
            cams[layer] = cam.cpu().numpy().tolist()

        return cams

    def _add_layer_data(self, activations, training_data: Dict[str, any], cams) -> None:
        for name, module in self.model.named_modules():
            if isinstance(module, nn.Conv2d):
                self._add_conv_layer_data(
                    name, module, activations, training_data, cams
                )
            elif isinstance(module, (nn.MaxPool2d, nn.AvgPool2d)):
                self._add_pooling_layer_data(name, module, activations, training_data)
            elif isinstance(module, nn.Linear):
                self._add_linear_layer_data(name, module, activations, training_data)
            else:
                # print("Unknown layer type found: ", name, module)
                pass

    def _add_linear_layer_data(
        self, name, layer: nn.Linear, activations, training_data
    ) -> None:
        """Extract and add data for linear layers."""
        if name not in activations:
            return

        activation = activations[name]

        # Average over the batch dimension and convert to numpy once
        avg_activation = activation.mean(dim=0).detach().cpu().numpy()

        # Convert weights and biases to numpy for more efficient serialization
        weights_np = layer.weight.data.detach().cpu().numpy()

        layer_data = {
            "layer_name": name,
            "type": "linear",
            "in_features": layer.in_features,
            "out_features": layer.out_features,
            "weights": weights_np.tolist(),
            "activations": avg_activation.tolist(),
        }

        # Add gradients if available
        if layer.weight.grad is not None:
            layer_data["gradients"] = layer.weight.grad.detach().cpu().numpy().tolist()

        # Add biases if available
        if layer.bias is not None:
            layer_data["biases"] = layer.bias.data.detach().cpu().numpy().tolist()

        training_data["layers"].append(layer_data)

    def _add_conv_layer_data(
        self, name, layer, activations, training_data, cams
    ) -> None:
        """Extract and add data for a convolutional layer."""
        # Skip if no activations for this layer
        if name not in activations:
            return

        # Get feature maps
        feature_maps = self._get_feature_maps(name, activations)

        # Convert filters to numpy for serialization
        filters_np = layer.weight.data.detach().cpu().numpy()

        # Create conv layer data structure
        conv_layer_data = {
            "layer_name": name,
            "type": "conv",
            "filters": filters_np.tolist(),
            "feature_maps": feature_maps,
            "kernel_size": list(layer.kernel_size),
            "stride": list(layer.stride),
            "padding": list(layer.padding),
            "input_shape": [
                layer.in_channels,
                activations[name].shape[2],
                activations[name].shape[3],
            ],
            "output_shape": [
                layer.out_channels,
                activations[name].shape[2],
                activations[name].shape[3],
            ],
            # TODO: REMOVE
            "in_channels": layer.in_channels,
            "out_channels": layer.out_channels,
        }

        # Add output shape
        act = activations[name]
        if act.dim() >= 4:  # Ensure it has expected dimensions
            conv_layer_data["output_shape"] = [
                layer.out_channels,
                act.shape[2],
                act.shape[3],
            ]

        # Add CAM if available
        if cams and name in cams:
            conv_layer_data["cam"] = cams[name]

        training_data["layers"].append(conv_layer_data)

    def _add_pooling_layer_data(self, name, module, activations, training_data) -> None:
        """Extract and add data for a pooling layer."""
        # Skip if no activations for this layer
        if name not in activations:
            return

        pool_type = "max" if isinstance(module, nn.MaxPool2d) else "avg"
        feature_maps = self._get_feature_maps(name, activations)

        # Handle different types of kernel_size and stride specifications
        if isinstance(module.kernel_size, int):
            kernel_size = [module.kernel_size, module.kernel_size]
        else:
            kernel_size = list(module.kernel_size)

        if isinstance(module.stride, int):
            stride = [module.stride, module.stride]
        else:
            stride = list(module.stride)

        # Create pooling layer data structure
        pooling_layer_data = {
            "layer_name": name,
            "type": "pool",
            "pool_type": pool_type,
            "kernel_size": kernel_size,
            "stride": stride,
            "feature_maps": feature_maps,
        }

        # Add output shape
        act = activations[name]
        if act.dim() >= 4:  # Ensure it has expected dimensions
            pooling_layer_data["output_shape"] = [
                act.shape[1],
                act.shape[2],
                act.shape[3],
            ]

        training_data["layers"].append(pooling_layer_data)

    def _get_feature_maps(self, name, activations) -> List[Dict[str, Any]]:
        """Extract feature maps from activations for a given layer."""
        feature_maps = []
        if name not in activations:
            return feature_maps

        act = activations[name]
        if act.dim() < 4:  # Need at least 4D tensor for feature maps (B,C,H,W)
            return feature_maps

        # Take the first batch item only to reduce data size
        act_first = act[0].detach().cpu()

        # Process each channel
        for channel_idx in range(act_first.shape[0]):
            # Convert to numpy once
            channel_data = act_first[channel_idx].numpy()

            feature_map = {
                "channel_id": channel_idx,
                "activation_map": channel_data.tolist(),
                "shape": channel_data.shape
            }
            feature_maps.append(feature_map)

        return feature_maps

    def _transmit_data(self, training_data: Dict[str, Any]) -> None:
        packed_data = ujson.dumps(training_data)
        self.publisher.send_string(packed_data)  # changed code
