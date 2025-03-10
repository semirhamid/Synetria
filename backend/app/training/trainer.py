import torch
import torch.nn as nn
import json
import asyncio
import websockets
import numpy as np
from typing import Dict, List, Any, Tuple


class Trainer:
    def __init__(self, port: int = 8000):
        self.port = port  # to add websocket connection initiation later. the training shouldn't be dependent on if there's an active connection or not, it should just send the information if a connection is established.

    async def train(
        self, model, data_loader, criterion, optimizer, websocket, num_epochs=5
    ):
        """Main training method that coordinates the training process and sends data via WebSocket."""

        # Get overall model structure before beginning
        model_structure = self._get_model_structure(model, num_epochs)

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = model.to(device)
        print("Device: ", device)

        # Training loop
        for epoch in range(num_epochs):
            for batch_idx, (inputs, targets) in enumerate(data_loader):
                inputs, targets = inputs.to(device), targets.to(device)

                # Regular PyTorch training step
                optimizer.zero_grad()

                # Capture activations and do forward pass
                activations, outputs = self._forward_with_activations(model, inputs)

                # Compute loss and do backward pass
                loss = criterion(outputs, targets)
                loss.backward()
                optimizer.step()
                if batch_idx % 100 == 0:
                    print(
                        f"Train Epoch: {epoch} [{batch_idx * len(inputs)}/{len(data_loader.dataset)} "
                        f"({100. * batch_idx / len(data_loader):.0f}%)]\tLoss: {loss.item():.6f}"
                    )

                # Prepare metadata
                training_data = {
                    "epoch": epoch + 1,
                    "batch": batch_idx + 1,
                    "loss": loss.item(),
                    "learning_rate": optimizer.param_groups[0]["lr"],
                    "batch_size": inputs.size(0),
                    "model_structure": model_structure,
                    "layers": [],
                    "conv_layers": [],
                    "pooling_layers": [],
                    "input_image": (
                        inputs[0].cpu().numpy().tolist() if inputs[0].ndim > 1 else None
                    ),
                }

                # Extract and add linear layer data
                self._add_linear_layer_data(model, training_data)

                # Extract and add CNN layer data
                self._add_cnn_layer_data(model, activations, training_data)

                # Send data via WebSocket
                await self._send_websocket_data(websocket, training_data)

    def _get_model_structure(self, model, num_epochs) -> Dict[str, Any]:
        """Extract and return the model structure metadata."""
        model_structure = {
            "total_layers": len(list(model.modules())),
            "total_params": sum(p.numel() for p in model.parameters()),
            "total_epochs": num_epochs,
            "layer_details": [],
        }

        for name, layer in model.named_modules():
            if isinstance(layer, nn.Linear):
                model_structure["layer_details"].append(
                    {
                        "layer_name": name,
                        "layer_type": "linear",
                        "input_size": list(layer.weight.shape)[1],
                        "output_size": list(layer.weight.shape)[0],
                    }
                )
            elif isinstance(layer, nn.Conv2d):
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

        return model_structure

    def _forward_with_activations(
        self, model, inputs
    ) -> Tuple[Dict[str, torch.Tensor], torch.Tensor]:
        """Perform forward pass while capturing layer activations."""
        # Should be extended to use more advanced techniques than just capturing activations, such as gradcam, ...

        activations = {}
        hooks = []

        # Define hook function to capture activations
        def get_activation(name):
            def hook(model, input, output):
                activations[name] = output.detach()

            return hook

        # Register hooks for CNN layers
        for name, module in model.named_modules():
            if isinstance(module, (nn.Conv2d, nn.MaxPool2d, nn.AvgPool2d)):
                hooks.append(module.register_forward_hook(get_activation(name)))

        # Perform the forward pass
        outputs = model(inputs)

        # Remove hooks
        for hook in hooks:
            hook.remove()

        return activations, outputs

    def _add_linear_layer_data(self, model, training_data) -> None:
        """Extract and add data for linear layers."""
        for name, param in model.named_parameters():
            if "weight" in name or "bias" in name:
                if "conv" not in name and "pool" not in name:
                    layer_data = {
                        "layer": name,
                        "weights": param.data.tolist(),
                        "gradients": (
                            param.grad.tolist() if param.grad is not None else None
                        ),
                    }
                    if "bias" in name:
                        # Find the last added layer and add biases to it
                        if training_data["layers"]:
                            training_data["layers"][-1]["biases"] = param.data.tolist()
                    else:
                        training_data["layers"].append(layer_data)

    def _add_cnn_layer_data(self, model, activations, training_data) -> None:
        """Extract and add data for CNN layers (convolutional and pooling)."""
        for name, module in model.named_modules():
            # Process convolutional layers
            if isinstance(module, nn.Conv2d):
                self._add_conv_layer_data(name, module, activations, training_data)
            # Process pooling layers
            elif isinstance(module, (nn.MaxPool2d, nn.AvgPool2d)):
                self._add_pooling_layer_data(name, module, activations, training_data)

    def _add_conv_layer_data(self, name, module, activations, training_data) -> None:
        """Extract and add data for a convolutional layer."""
        # Collect filter information
        filters = []
        for filter_idx in range(module.out_channels):
            for channel_idx in range(module.in_channels):
                filter_data = {
                    "filter_id": filter_idx,
                    "channel": channel_idx,
                    "filter_weights": module.weight[filter_idx, channel_idx]
                    .detach()
                    .cpu()
                    .numpy()
                    .tolist(),
                }
                filters.append(filter_data)

        # Collect feature maps from activations
        feature_maps = self._get_feature_maps(name, activations)

        # Create conv layer data structure
        conv_layer_data = {
            "layer_name": name,
            "filters": filters,
            "feature_maps": feature_maps,
            "kernel_size": list(module.kernel_size),
            "stride": list(module.stride),
            "padding": list(module.padding),
            "input_shape": [module.in_channels, 0, 0],  # Placeholder
            "output_shape": [module.out_channels, 0, 0],  # Placeholder
        }

        # Update shapes if activations are available
        if name in activations:
            act = activations[name]
            conv_layer_data["output_shape"] = [
                module.out_channels,
                act.shape[2],
                act.shape[3],
            ]

        training_data["conv_layers"].append(conv_layer_data)

    def _add_pooling_layer_data(self, name, module, activations, training_data) -> None:
        """Extract and add data for a pooling layer."""
        pool_type = "max" if isinstance(module, nn.MaxPool2d) else "avg"

        # Collect feature maps from activations
        feature_maps = self._get_feature_maps(name, activations)

        # Handle kernel_size and stride which can be int or tuple
        kernel_size = (
            module.kernel_size
            if isinstance(module.kernel_size, int)
            else list(module.kernel_size)
        )
        stride = (
            module.stride if isinstance(module.stride, int) else list(module.stride)
        )

        # Create pooling layer data structure
        pooling_layer_data = {
            "layer_name": name,
            "pool_type": pool_type,
            "kernel_size": (
                [kernel_size, kernel_size]
                if isinstance(kernel_size, int)
                else kernel_size
            ),
            "stride": [stride, stride] if isinstance(stride, int) else stride,
            "input_shape": [0, 0, 0],  # Placeholder
            "output_shape": [0, 0, 0],  # Placeholder
            "feature_maps": feature_maps,
        }

        # Update shapes if activations are available
        if name in activations:
            act = activations[name]
            pooling_layer_data["output_shape"] = [
                act.shape[1],
                act.shape[2],
                act.shape[3],
            ]

        training_data["pooling_layers"].append(pooling_layer_data)

    def _get_feature_maps(self, name, activations) -> List[Dict[str, Any]]:
        """Extract feature maps from activations for a given layer."""
        feature_maps = []
        if name in activations:
            act = activations[name]

            # Take the first image in the batch for visualization, can't exactly show them all
            for channel_idx in range(act.shape[1]):
                feature_map = {
                    "channel_id": channel_idx,
                    "activation_map": act[0, channel_idx].cpu().numpy().tolist(),
                }
                feature_maps.append(feature_map)
        return feature_maps

    async def _send_websocket_data(self, websocket, data) -> None:
        """Send data to the client via WebSocket with error handling."""
        try:
            await websocket.send(json.dumps(data))
            await asyncio.sleep(0.1)  # Reduced from 5 seconds to be more responsive
        except websockets.exceptions.ConnectionClosed as e:
            print(f"WebSocket connection closed: {e}")
            raise  # Re-raise to let caller handle the disconnect
        except Exception as e:
            print(f"Error sending data via WebSocket: {e}")
            # Consider whether to raise or suppress other exceptions
