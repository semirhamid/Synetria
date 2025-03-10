import React, { useState, useEffect } from 'react';
import {
  MLPLayerData,
  ModelMetaData,
  ModelStructure,
  TrainingData,
} from './types';
import Node from './networkLayers/dense/Node';
import Edge from './networkLayers/dense/Edge';
import {
  DEFAULT_LAYER_SPACING,
  DEFAULT_NEURON_SPACING,
  DEFAULT_NODE_SIZE,
  LAYER_COLORS,
} from '../constants';
import { calculateNeuronPositions } from '../utils/calculations';
import LoadingComponent from './LoadingComponent';
import TensorFlow3DCNN from './CNN3D';

const NeuralNetwork: React.FC = () => {
  const [mlpData, setMlpData] = useState<MLPLayerData[] | null>(null);
  const [modelMetadata, setModelMetadata] = useState<ModelStructure | null>(
    null
  );
  const [layerSpacing, setLayerSpacing] = useState(DEFAULT_LAYER_SPACING);
  const [neuronSpacing, setNeuronSpacing] = useState(DEFAULT_NEURON_SPACING);
  const [nodeSize, setNodeSize] = useState(DEFAULT_NODE_SIZE);
  const [metaData, setMetaData] = useState<ModelMetaData | null>(null);
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [trainingData, setTrainingData] = useState<TrainingData | null>(null);
  const [visualizationType, setVisualizationType] = useState<'mlp' | 'cnn'>(
    'mlp'
  );

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000');

    socket.onopen = () => console.log('WebSocket connection established');
    socket.onmessage = (event) => {
      const receivedData: TrainingData = JSON.parse(event.data);
      console.log("Incoming data: ", receivedData);
      
      setTrainingData(receivedData);

      if (receivedData.epoch && receivedData.layers) {
        setMlpData(receivedData.layers);
        setModelMetadata(receivedData.model_structure);
        setCurrentEpoch(receivedData.epoch);
        const metaData: ModelMetaData = {
          epoch: receivedData.epoch,
          batch: receivedData.batch,
          batch_size: receivedData.batch_size,
          learning_rate: receivedData.learning_rate,
          loss: receivedData.loss,
        };
        setMetaData(metaData);
        
        // Detect if we're dealing with a CNN or MLP
        // If there are convolutional layers, switch to CNN visualization
        if (receivedData.conv_layers && receivedData.conv_layers.length > 0) {
          setVisualizationType('cnn');
        } else {
          setVisualizationType('mlp');
        }
      }
    };

    socket.onclose = () => console.log('WebSocket connection closed');

    return () => {
      socket.close();
    };
  }, []);

  // If we don't have data yet, show a loading state
  if (!metaData || !mlpData || !modelMetadata) {
    return <LoadingComponent />;
  }

  // Decide which visualizer to show based on model type
  if (visualizationType === 'cnn') {
    return <TensorFlow3DCNN trainingData={trainingData} />;
  }

  // MLP visualization (original)
  const networkLayers = modelMetadata.layer_details.map(
    (layer) => layer.output_size as number
  );
  const inputSize = modelMetadata.layer_details[0].input_size as number;
  networkLayers.unshift(inputSize);

  const width = 1200;
  const height = 600;

  // Calculate positions of all neurons
  const { layerPositions, neuronPositions } = calculateNeuronPositions(
    networkLayers,
    width,
    height,
    layerSpacing,
    neuronSpacing
  );

  const renderNetwork = () => {
    if (!mlpData || mlpData.length === 0) return null;

    const layerData = mlpData;
    const edges = [];
    const nodes = [];

    // Create edges (connections between neurons)
    for (let layerIdx = 0; layerIdx < layerData.length; layerIdx++) {
      const layer = layerData[layerIdx];
      const sourcePosY = layerPositions[layerIdx];
      const targetPosY = layerPositions[layerIdx + 1];

      if (layer.weights && layer.weights.length > 0) {
        for (let i = 0; i < layer.weights.length; i++) {
          for (let j = 0; j < layer.weights[i].length; j++) {
            const weight = layer.weights[i][j];
            const sourceNeuronPosX = neuronPositions[layerIdx][j];
            const targetNeuronPosX = neuronPositions[layerIdx + 1][i];

            edges.push(
              <Edge
                key={`${layerIdx}-${j}-${i}`}
                x1={sourceNeuronPosX}
                y1={sourcePosY}
                x2={targetNeuronPosX}
                y2={targetPosY}
                weight={weight}
              />
            );
          }
        }
      }
    }

    // Create nodes (neurons)
    for (let layerIdx = 0; layerIdx < networkLayers.length; layerIdx++) {
      const layerSize = networkLayers[layerIdx] as number;
      const posY = layerPositions[layerIdx];
      const layerColor = LAYER_COLORS[layerIdx % LAYER_COLORS.length];

      for (let neuronIdx = 0; neuronIdx < layerSize; neuronIdx++) {
        const posX = neuronPositions[layerIdx][neuronIdx];
        
        // Only render visible neurons to improve performance
        if (posX >= 0 && posX <= width && posY >= 0 && posY <= height) {
          nodes.push(
            <Node
              key={`${layerIdx}-${neuronIdx}`}
              x={posX}
              y={posY}
              size={nodeSize}
              color={layerColor}
            />
          );
        }
      }
    }

    return (
      <>
        {edges}
        {nodes}
      </>
    );
  };

  return (
    <div className="neural-network-container">
      <div className="neural-network-metadata bg-white p-4 shadow-md mb-4 rounded-md">
        <h2 className="text-xl font-bold mb-2">Neural Network Training</h2>
        <div className="grid grid-cols-5 gap-4">
          <div>
            <div className="text-sm text-gray-500">Epoch</div>
            <div className="text-xl font-semibold">
              {currentEpoch} / {modelMetadata.total_epochs}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Batch</div>
            <div className="text-xl font-semibold">{metaData.batch}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Loss</div>
            <div className="text-xl font-semibold">
              {metaData.loss.toFixed(4)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Learning Rate</div>
            <div className="text-xl font-semibold">
              {metaData.learning_rate}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Parameters</div>
            <div className="text-xl font-semibold">
              {modelMetadata.total_params}
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex space-x-4">
          <label>
            Layer Spacing:
            <input
              type="range"
              min="50"
              max="300"
              value={layerSpacing}
              onChange={(e) => setLayerSpacing(Number(e.target.value))}
              className="ml-2"
            />
          </label>
          <label>
            Neuron Spacing:
            <input
              type="range"
              min="10"
              max="100"
              value={neuronSpacing}
              onChange={(e) => setNeuronSpacing(Number(e.target.value))}
              className="ml-2"
            />
          </label>
          <label>
            Node Size:
            <input
              type="range"
              min="5"
              max="30"
              value={nodeSize}
              onChange={(e) => setNodeSize(Number(e.target.value))}
              className="ml-2"
            />
          </label>
        </div>
      </div>
      
      <div className="neural-network-visualization bg-white p-4 shadow-md rounded-md overflow-hidden" style={{ height: '600px' }}>
        <svg width={width} height={height}>
          {renderNetwork()}
        </svg>
      </div>
    </div>
  );
};

export default NeuralNetwork;
