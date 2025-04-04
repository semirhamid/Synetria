# Synetria: Real-Time Neural Network Visualizer

Synetria is a tool designed for real-time, interactive 3D visualization of neural network training processes, currently supporting Multilayer Perceptrons (MLPs) and Convolutional Neural Networks (CNNs). The primary goal is to provide developers and researchers with insights into their PyTorch models during training.

The backend integrates with PyTorch, using hooks to capture layer-specific information (weights, activations, gradients) during training epochs. It employs ZeroMQ for efficient inter-process communication between the training process and the server process, which then streams this data to the frontend via Server-Sent Events (SSE). The frontend, built with React and Three.js (using React Three Fiber), renders the network structure and training dynamics in an interactive 3D environment.

Next step is to enhance CNN support, add more visualization options (like CAMs, feature map inspection), and refine the PyTorch integration to work seamlessly as a plugin or wrapper. We also aim to further improve the performance of the system, ensuring that the visualization is smooth and responsive even for large models and datasets without slowing down the training process.

## 🌟 Features

- **Real-Time Training Visualization**: Observe weights, activations (planned), and other metrics as the model trains.
- **Support for MLP & CNN Architectures**: Visualize both simple feedforward networks and convolutional networks.
- **Flexible Network Configuration**: Adapts to different layer counts, neuron/channel numbers, and network parameters.
- **Interactive 3D Environment**: Use React Three Fiber for smooth navigation and inspection of the network graph.
- **Component-Based Frontend**: Easily extendable UI built with React and TypeScript.
- **Decoupled Backend Architecture**: Uses ZeroMQ for robust inter-process communication between the trainer and the client-facing server.

---

## 🗂️ Project Structure

The repository is organized into `backend` and `frontend` directories.

### **Backend** (`backend/`)

Handles model definition, training loop execution, data extraction, and communication with the frontend.

- **`main.py`**: Entry point for the backend application. Parses command-line arguments, loads datasets (e.g., MNIST for CNNs, synthetic data for MLPs) and models (e.g., SimpleNN, ResNet18), initializes the `TrainingManager`.
- **`app/`**: Core application logic.
    - **`server/`**:
        - **`training_manager.py`**: Orchestrates the training. Starts the trainer and client manager processes and facilitates communication between them using ZeroMQ.
        - **`client_manager.py`** (Conceptual): Manages client connections (via FastAPI and SSE) and forwards data received from the trainer via ZeroMQ.
        - **`trainer.py`** (Conceptual): Runs the PyTorch training loop, extracts model data (weights, gradients, etc.) at each step, and sends it to the `client_manager` via ZeroMQ.
    - **`models/`**: PyTorch model definitions.
        - **`simple_nn.py`**: Defines a basic MLP.
        - **`cnn.py`**: Defines various CNN architectures (e.g., `LeNetBasedModel`, `VGGInspiredCNN`). Note: `main.py` currently uses `torchvision.models.resnet18`.
    - **`utils/`**: Utility functions (e.g., data formatting - conceptual).
- **`data/`**: Default directory for downloading datasets (e.g., MNIST, CIFAR).
- **`requirements.txt`**: Lists Python dependencies (PyTorch, Torchvision, FastAPI, Uvicorn, ZeroMQ, etc.).

**Key Technologies:** Python, PyTorch, FastAPI, Uvicorn, ZeroMQ (pyzmq), asyncio.

### **Frontend** (`frontend/`)

Renders the 3D visualization and handles user interaction, receiving real-time data from the backend via SSE.

- **`src/`**: Main source code directory.
    - **`components/`**: Reusable React components.
        - **`NeuralNetwork.tsx`**: The core component responsible for orchestrating the 3D visualization using React Three Fiber.
        - **`layers/`**: Components specific to rendering different layer types (Dense, Conv2D, Pooling).
        - **`Node.tsx`, `Edge.tsx`**: Components for rendering individual neurons and their connections (primarily for MLPs).
        - **`SideBar.tsx`**: UI panel for controls and information display.
        - **`types.ts`**: Defines core TypeScript interfaces for data structures (`TrainingData`, `ModelStructure`, etc.).
        - **`layers/layers.types.ts`**: Defines TypeScript interfaces for specific layer data (`DenseLayerData`, `ConvLayerData`, `PoolingLayerData`, etc.).
    - **`hooks/`**: Custom React hooks (e.g., `useEventSource` for handling SSE connection).
    - **`services/`**: Modules for interacting with the backend API/SSE endpoint.
    - **`utils/`**: Utility functions and constants.
- **`public/`**: Static assets (e.g., `index.html`).
- **`package.json`**: Project metadata, dependencies (React, Three.js, R3F, Zustand, Tailwind CSS, etc.), and scripts (`dev`, `build`).
- **`vite.config.ts`**: Build configuration for Vite.
- **`tailwind.config.js`**: Configuration for Tailwind CSS.

**Key Technologies:** TypeScript, React, Three.js, React Three Fiber (@react-three/fiber), Drei (@react-three/drei), Zustand (state management), Tailwind CSS, Vite, Server-Sent Events (SSE).

---

## API Contract: Server-Sent Events (SSE) Data Payload

The backend streams training data to the frontend using SSE. Each message is a JSON object containing a snapshot of the training state for a given step (e.g., after a batch).

### **Payload Structure (`TrainingData`)**

```typescript
// Based on frontend/src/components/types.ts
interface TrainingData {
  metadata: TrainingMetadata;      // Info about the current training step
  parameters: TrainingParams;      // Static parameters for the training run
  model_structure: ModelStructure; // Overall structure of the model
  network_input: NetworkInput;     // Example input data being processed
  layers: LayerData[];             // Detailed data for each layer in the model
}

// ---- Supporting Interfaces ----

interface TrainingMetadata {
  epoch: number;              // Current epoch number (1-indexed)
  batch: number;              // Current batch number within the epoch (1-indexed)
  loss: number;               // Loss value for the current step
}

interface TrainingParams {
  total_epochs: number;       // Total number of epochs for the training run
  learning_rate: number;      // Current learning rate
  batch_size: number;         // Number of samples per batch
}

interface ModelStructure {
  total_layers: number;     // Total number of layers in the model
  total_params: number;     // Total number of trainable parameters
  layer_details: {          // Basic info about each layer (name, sizes)
    layer_name: string;
    input_size: number;     // Note: Size might be ambiguous for CNNs (use input_shape/output_shape in LayerData)
    output_size: number;    // Note: Size might be ambiguous for CNNs (use input_shape/output_shape in LayerData)
  }[];
}

interface NetworkInput {
  type: string;             // Type of input (e.g., 'image', 'vector')
  data: number[][][];       // Actual input data sample(s) [batch?, channels, height, width] or [batch?, features]
}

// LayerData is a union type. See details below.
type LayerData = DenseLayerData | ConvLayerData | PoolingLayerData; // (Potentially others)

```

### **Layer Data Details (`LayerData`)**

The `layers` array contains objects specific to each layer type, identified by the `type` field.

```typescript
// Based on frontend/src/components/layers/layers.types.ts

// Common fields for all layers (BaseLayerData)
interface BaseLayerData {
  layer_name: string;        // Name of the layer (e.g., "fc1", "conv2")
  type: string;              // Type identifier (e.g., "linear", "conv2d", "maxpool2d")
  input_shape?: number[];    // Shape of the input tensor [channels, height, width] or [features]
  output_shape?: number[];   // Shape of the output tensor
}

// ---- Specific Layer Types ----

interface DenseLayerData extends BaseLayerData {
  type: 'linear' | 'dense';
  weights: number[][];       // Weight matrix [output_neurons, input_neurons]
  biases: number[];          // Bias vector [output_neurons]
  activations: number[];     // Activation values for this layer's output [output_neurons]
  gradients?: number[][];    // Gradients of the weights (optional)
}

interface ConvLayerData extends BaseLayerData {
  type: 'conv' | 'conv2d' | 'convolution';
  kernel_size: [number, number]; // [height, width]
  stride: [number, number];      // [height, width]
  padding: [number, number];     // [height, width]
  in_channels?: number;          // Number of input channels
  out_channels?: number;         // Number of output channels (filters)
  filters: number[][][][];       // Filter weights [out_channel, in_channel, kernel_height, kernel_width]
  feature_maps?: FeatureMap[];   // Output activation maps (optional)
  cam?: number[][];              // Class Activation Map (optional)
}

interface PoolingLayerData extends BaseLayerData {
  type: 'pool' | 'maxpool' | 'avgpool' | 'maxpool2d' | 'avgpool2d';
  pool_type: 'max' | 'avg';      // Type of pooling
  kernel_size: [number, number]; // [height, width]
  stride: [number, number];      // [height, width]
  padding?: [number, number];    // [height, width] (Optional)
  feature_maps?: FeatureMap[];   // Output activation maps (optional)
}

// ---- FeatureMap Structure ----
interface FeatureMap {
  channel_id: number;            // Index of the output channel this map belongs to
  activation_map: number[][];    // The 2D activation map data
  shape: [number, number];       // [height, width]
}

```

---

## 🚀 How to Run

### Backend

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment (optional but recommended):
    ```bash
    python -m venv venv
    source venv/bin/activate # Linux/macOS
    # .\venv\Scripts\activate # Windows
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run the backend server:
    ```bash
    # Example: Run with default settings (CNN model, localhost:8000, ZMQ on 5555)
    python main.py

    # Example: Run MLP model
    python main.py --model mlp

    # Example: Specify host/port
    python main.py --host 0.0.0.0 --port 8080 --zmq-port 5556
    ```
    Available arguments:
    - `--host`: Host for the SSE server (default: `localhost`).
    - `--port`: Port for the SSE server (default: `8000`).
    - `--zmq-port`: Port for ZeroMQ IPC (default: `5555`).
    - `--model`: Type of model to train (`cnn` or `mlp`, default: `cnn`).

    The server will start, initialize the model and data, and begin the training process, waiting for frontend connections on the specified host/port.

### Frontend

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    yarn install
    # or: npm install
    ```
3.  Start the development server:
    ```bash
    yarn dev
    # or: npm run dev
    ```
4.  Open your web browser and navigate to the URL provided by Vite (usually `http://localhost:5173`).

The frontend will connect to the backend's SSE endpoint (defaults to `ws://localhost:8000/stream`) and start visualizing the network and training updates.

---

## 💡 Contributing

Contributions are welcome! Feel free to open issues for bugs or feature requests, or submit pull requests to improve Synetria. Please adhere to standard coding practices and ensure your changes are well-tested.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---
