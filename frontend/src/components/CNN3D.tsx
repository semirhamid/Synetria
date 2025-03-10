import React, { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { TrainingData } from './types';
import { ConvolutionLayer3D } from './networkLayers/cnn3D/ConvolutionLayer3D';
import { PoolingLayer3D } from './networkLayers/cnn3D/PoolingLayer3D';
import { InputLayer3D } from './networkLayers/cnn3D/InputLayer3D';
import { FlattenLayer3D } from './networkLayers/cnn3D/FlattenLayer3D';
import { DenseLayer3D } from './networkLayers/cnn3D/DenseLayer3D';
import { createConnectionLine } from '../utils/visualization3d';

interface CNN3DProps {
  trainingData: TrainingData | null;
}

// Camera controller component
const CameraController = () => {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  return <OrbitControls enableDamping dampingFactor={0.1} rotateSpeed={0.5} />;
};

// Network info display component
const NetworkInfo = ({ trainingData }: { trainingData: TrainingData }) => {
  return (
    <div className="absolute top-4 left-4 bg-white bg-opacity-80 p-4 rounded-lg shadow-md z-10">
      <h2 className="text-xl font-bold mb-2">Network Information</h2>
      <div className="grid grid-cols-2 gap-2">
        <div>Epoch:</div>
        <div className="font-medium">{trainingData.epoch} / {trainingData.model_structure.total_epochs}</div>
        <div>Loss:</div>
        <div className="font-medium">{trainingData.loss.toFixed(4)}</div>
        <div>Learning Rate:</div>
        <div className="font-medium">{trainingData.learning_rate.toExponential(2)}</div>
      </div>
    </div>
  );
};

// Layer connections component
const LayerConnections = ({ layers, startX, layerSpacing }: { 
  layers: [], 
  startX: number, 
  layerSpacing: number 
}) => {
  // Create connections between consecutive layers
  return (
    <>
      {layers.map((_, index) => {
        if (index === layers.length - 1) return null;
        
        const fromX = startX + index * layerSpacing;
        const toX = startX + (index + 1) * layerSpacing;
        
        // Create a connection line
        const connectionLine = createConnectionLine(
          [fromX, 0, 0],
          [toX, 0, 0],
          '#9ca3af',
          0.02
        );
        
        return <primitive key={`connection-${index}`} object={connectionLine} />;
      })}
    </>
  );
};

// Main component with scene setup
const NetworkScene = ({ trainingData }: { trainingData: TrainingData }) => {
  const layers = trainingData.model_structure.layer_details;
  
  // Calculate layout
  const layerSpacing = 3;
  const totalWidth = (layers.length - 1) * layerSpacing;
  const startX = -totalWidth / 2;
  
  // Create an array of all layers including input for connections
  const allLayers = [{ layer_type: 'input', layer_name: 'input' }, ...layers];
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <CameraController />
      
      {/* Layer connections */}
      <LayerConnections 
        layers={allLayers} 
        startX={startX} 
        layerSpacing={layerSpacing} 
      />
      
      {/* Input layer */}
      {trainingData.input_image && (
        <InputLayer3D 
          position={[startX, 0, 0]} 
          inputImage={trainingData.input_image}
        />
      )}
      
      {/* Network layers */}
      {layers.map((layer, index) => {
        const xPosition = startX + (index + 1) * layerSpacing;
        
        if (layer.layer_type === 'conv') {
          const convLayerData = trainingData.conv_layers?.find(
            l => l.layer_name === layer.layer_name
          );
          if (convLayerData) {
            return (
              <ConvolutionLayer3D 
                key={layer.layer_name}
                position={[xPosition, 0, 0]}
                layer={convLayerData}
              />
            );
          }
        } else if (layer.layer_type === 'pool') {
          const poolLayerData = trainingData.pooling_layers?.find(
            l => l.layer_name === layer.layer_name
          );
          if (poolLayerData) {
            return (
              <PoolingLayer3D 
                key={layer.layer_name}
                position={[xPosition, 0, 0]}
                layer={poolLayerData}
              />
            );
          }
        } else if (layer.layer_type === 'flatten') {
          return (
            <FlattenLayer3D 
              key={layer.layer_name}
              position={[xPosition, 0, 0]}
              name={layer.layer_name}
              outputSize={layer.output_size as number}
            />
          );
        } else if (layer.layer_type === 'linear') {
          const linearLayerData = trainingData.layers.find(
            l => l.layer.includes(layer.layer_name)
          );
          if (linearLayerData) {
            return (
              <DenseLayer3D 
                key={layer.layer_name}
                position={[xPosition, 0, 0]}
                name={layer.layer_name}
                outputSize={layer.output_size as number}
                weights={linearLayerData.weights}
              />
            );
          }
        }
        
        return null;
      })}
    </>
  );
};

const TensorFlow3DCNN: React.FC<CNN3DProps> = ({ trainingData }) => {
  if (!trainingData) {
    return <div className="w-full h-full flex items-center justify-center">Loading data...</div>;
  }

  return (
    <div className="w-full h-full relative">
      <NetworkInfo trainingData={trainingData} />
      <Canvas>
        <NetworkScene trainingData={trainingData} />
      </Canvas>
    </div>
  );
};

export default TensorFlow3DCNN; 