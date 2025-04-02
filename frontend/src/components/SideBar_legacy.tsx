import React, { useCallback } from 'react';
import debounce from 'lodash.debounce';
import { ModelStructure, TrainingMetadata, TrainingParams } from './types';



// Sidebar Component
export const Sidebar: React.FC<{
  modelStructure: ModelStructure;
  modelMetadata: TrainingMetadata;
  trainingParams: TrainingParams;
}> = ({ modelMetadata, trainingParams, modelStructure }) => (
  <div className="w-96 bg-linear-to-r from-gray-900 via-gray-800 to-gray-700 text-white p-6 shadow-xl">
    <h2 className="text-2xl font-bold mb-6 text-gray-100">Model Metadata</h2>
    <div className="space-y-4">
      <p>
        <strong className="text-gray-300">Total Layers:</strong>{' '}
        <span className="text-gray-100">{modelStructure.total_layers}</span>
      </p>
      <p>
        <strong className="text-gray-300">Total Epoch:</strong>{' '}
        <span className="text-gray-100">{trainingParams.total_epochs}</span>
      </p>
      <p>
        <strong className="text-gray-300">Current Epoch:</strong>{' '}
        <span className="text-red-400 font-extrabold">{modelMetadata.epoch}</span>
      </p>
      <p>
        <strong className="text-gray-300">Total Params:</strong>{' '}
        <span className="text-gray-100">{modelStructure.total_params}</span>
      </p>
      <h3 className="text-xl font-semibold mt-6 text-gray-200">
        Current Metadata
      </h3>
      <div className="p-4 bg-gray-800 rounded-lg shadow-lg space-y-2">
        <p>
          <strong>Epoch:</strong> {modelMetadata.epoch}
        </p>
        <p>
          <strong>Batch:</strong> {modelMetadata.batch}
        </p>
        <p>
          <strong>Batch Size:</strong> {trainingParams.batch_size}
        </p>
        <p>
          <strong>Learning Rate:</strong> {trainingParams.learning_rate.toFixed(5)}
        </p>
        <p>
          <strong>Loss:</strong> {modelMetadata.loss.toFixed(5)}
        </p>
      </div>
    </div>
    <h3 className="text-lg font-medium mt-6 mb-3 text-gray-200">
      Layer Details:
    </h3>
    <ul className="space-y-3">
      {modelStructure.layer_details.map((layer, index) => (
        <li
          key={`layer-meta-${index}`}
          className="p-4 bg-gray-700 rounded-lg shadow-md hover:bg-gray-600 transition-all flex items-center justify-between"
        >
          <strong className="text-gray-100">{layer.layer_name}</strong>
          <span className="text-sm text-gray-400">
            Input: {layer.input_size}, Output: {layer.output_size}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

// Slider Controls Component
export const SliderControls: React.FC<{
  layerSpacing: number;
  setLayerSpacing: (value: number) => void;
  neuronSpacing: number;
  setNeuronSpacing: (value: number) => void;
  nodeSize: number;
  setNodeSize: (value: number) => void;
}> = ({
  layerSpacing,
  setLayerSpacing,
  neuronSpacing,
  setNeuronSpacing,
  nodeSize,
  setNodeSize,
}) => {
  const handleLayerSpacingChange = useCallback(
    debounce((value: number) => setLayerSpacing(value), 200),
    [setLayerSpacing]
  );
  const handleNeuronSpacingChange = useCallback(
    debounce((value: number) => setNeuronSpacing(value), 200),
    [setNeuronSpacing]
  );
  const handleNodeSizeChange = useCallback(
    debounce((value: number) => setNodeSize(value), 200),
    [setNodeSize]
  );

  return (
    <div className="w-96 bg-linear-to-b from-gray-900 via-gray-800 to-gray-700 text-white p-6 shadow-xl">
      <h3 className="text-xl font-bold mb-6">Adjust Visual Controls</h3>
      <div className="space-y-6">
        <div>
          <label className="block text-gray-300 mb-2">Layer Spacing</label>
          <input
            type="range"
            min="5"
            max="20"
            value={layerSpacing}
            onChange={(e) => handleLayerSpacingChange(Number(e.target.value))}
            className="w-full cursor-pointer accent-red-500"
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-2">Neuron Spacing</label>
          <input
            type="range"
            min="1"
            max="5"
            value={neuronSpacing}
            onChange={(e) => handleNeuronSpacingChange(Number(e.target.value))}
            className="w-full cursor-pointer accent-green-500"
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-2">Node Size</label>
          <input
            type="range"
            min="0.2"
            max="1"
            step="0.1"
            value={nodeSize}
            onChange={(e) => handleNodeSizeChange(Number(e.target.value))}
            className="w-full cursor-pointer accent-blue-500"
          />
        </div>
      </div>
    </div>
  );
};
