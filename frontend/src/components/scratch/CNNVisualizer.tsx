import React, { useState, useEffect } from 'react';
import { TrainingData, ModelStructure, ModelMetaData } from '../types';
import ConvolutionalLayer from './ConvolutionalLayer';
import PoolingLayer from './PoolingLayer';
import InputImage from './InputImage';
import LoadingComponent from '../LoadingComponent';

interface CNNVisualizerProps {
  trainingData: TrainingData | null;
}

const CNNVisualizer: React.FC<CNNVisualizerProps> = ({ trainingData }) => {
  const [metaData, setMetaData] = useState<ModelMetaData | null>(null);
  const [modelStructure, setModelStructure] = useState<ModelStructure | null>(null);
  const [activeLayerIndex, setActiveLayerIndex] = useState<number>(0);

  useEffect(() => {
    if (trainingData) {
      setModelStructure(trainingData.model_structure);
      setMetaData({
        epoch: trainingData.epoch,
        batch: trainingData.batch,
        batch_size: trainingData.batch_size,
        learning_rate: trainingData.learning_rate,
        loss: trainingData.loss,
      });
    }
  }, [trainingData]);

  if (!trainingData || !modelStructure || !metaData) {
    return <LoadingComponent />;
  }

  // Get only the conv and pool layers from the model structure
  const cnnLayers = modelStructure.layer_details.filter(
    layer => layer.layer_type === 'conv' || layer.layer_type === 'pool'
  );

  // Get active layer data based on layer type
  const getActiveLayerComponent = () => {
    if (activeLayerIndex < 0 || activeLayerIndex >= cnnLayers.length) {
      return <div>No layer selected</div>;
    }

    const activeLayer = cnnLayers[activeLayerIndex];
    
    if (activeLayer.layer_type === 'conv') {
      const convLayerData = trainingData.conv_layers?.find(
        layer => layer.layer_name === activeLayer.layer_name
      );
      
      if (convLayerData) {
        return <ConvolutionalLayer layer={convLayerData} />;
      }
    } else if (activeLayer.layer_type === 'pool') {
      const poolLayerData = trainingData.pooling_layers?.find(
        layer => layer.layer_name === activeLayer.layer_name
      );
      
      if (poolLayerData) {
        return <PoolingLayer layer={poolLayerData} />;
      }
    }
    
    return <div>Layer data not available</div>;
  };

  return (
    <div className="cnn-visualizer">
      <div className="metadata bg-white p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-bold mb-4">CNN Training Visualization</h2>
        
        <div className="grid grid-cols-5 gap-4">
          <div className="metadata-item">
            <div className="text-sm text-gray-600">Epoch</div>
            <div className="text-xl font-semibold">{metaData.epoch} / {modelStructure.total_epochs}</div>
          </div>
          <div className="metadata-item">
            <div className="text-sm text-gray-600">Batch</div>
            <div className="text-xl font-semibold">{metaData.batch}</div>
          </div>
          <div className="metadata-item">
            <div className="text-sm text-gray-600">Learning Rate</div>
            <div className="text-xl font-semibold">{metaData.learning_rate.toExponential(2)}</div>
          </div>
          <div className="metadata-item">
            <div className="text-sm text-gray-600">Loss</div>
            <div className="text-xl font-semibold">{metaData.loss.toFixed(4)}</div>
          </div>
          <div className="metadata-item">
            <div className="text-sm text-gray-600">Parameters</div>
            <div className="text-xl font-semibold">{modelStructure.total_params.toLocaleString()}</div>
          </div>
        </div>
      </div>
      
      <div className="cnn-visualizer-content grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="sidebar lg:col-span-1">
          {trainingData.input_image && (
            <InputImage imageData={trainingData.input_image} />
          )}
          
          <div className="layer-navigation mt-6 bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-bold mb-4">Layers</h3>
            <div className="layer-list">
              {cnnLayers.map((layer, index) => (
                <button
                  key={layer.layer_name}
                  onClick={() => setActiveLayerIndex(index)}
                  className={`w-full text-left p-2 mb-2 rounded ${
                    index === activeLayerIndex
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-medium">{layer.layer_name}</div>
                  <div className="text-xs">
                    {layer.layer_type === 'conv' ? 'Convolutional' : 'Pooling'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="main-content lg:col-span-3">
          {getActiveLayerComponent()}
        </div>
      </div>
    </div>
  );
};

export default CNNVisualizer;