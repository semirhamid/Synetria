import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';

import LoadingComponent from './LoadingComponent';
import LayerVisualizer from './layers/LayerVisualizer';
import { Sidebar, SliderControls } from './SideBar';
import {
  LayerData,
  ModelMetaData,
  ModelStructure,
  TrainingData,
} from './types';
import {
  DEFAULT_LAYER_SPACING,
  DEFAULT_NEURON_SPACING,
  DEFAULT_NODE_SIZE,
  LAYER_COLORS,
} from '../constants';
import { InputImageVisualizer } from './layers/conv/InputImage';

const NeuralNetwork: React.FC = () => {
  const [networkInputData, setNetworkInputData] = useState<number[][][] | null>(
    null
  );
  const [networkData, setNetworkData] = useState<LayerData[] | null>(null);
  const [modelMetadata, setModelMetadata] = useState<ModelStructure | null>(
    null
  );
  const [metaData, setMetaData] = useState<ModelMetaData | null>(null);
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);

  const [layerSpacing, setLayerSpacing] = useState(DEFAULT_LAYER_SPACING);
  const [neuronSpacing, setNeuronSpacing] = useState(DEFAULT_NEURON_SPACING);
  const [nodeSize, setNodeSize] = useState(DEFAULT_NODE_SIZE);

  // Process WebSocket data only once for each received data
  const processWebSocketData = useCallback((receivedData: TrainingData) => {
    if (receivedData.epoch && receivedData.layers) {
      setNetworkData(receivedData.layers);
      setModelMetadata(receivedData.model_structure);
      setCurrentEpoch(receivedData.epoch);

      if (
        receivedData.network_input !== null &&
        receivedData.network_input.type == 'something'
      ) {
        setNetworkInputData(receivedData.network_input.data);
      }

      const metaData: ModelMetaData = {
        epoch: receivedData.epoch,
        batch: receivedData.batch,
        batch_size: receivedData.batch_size,
        learning_rate: receivedData.learning_rate,
        loss: receivedData.loss,
      };
      setMetaData(metaData);
    }
  }, []);

  // WebSocket connection
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000');

    socket.onopen = () => console.log('WebSocket connection established');
    socket.onmessage = (event) => {
      try {
        const receivedData: TrainingData = JSON.parse(event.data);
        processWebSocketData(receivedData);
      } catch (error) {
        console.error('Error processing WebSocket data:', error);
      }
    };

    socket.onclose = () => console.log('WebSocket connection closed');
    socket.onerror = (error) => console.error('WebSocket error:', error);

    return () => {
      socket.close();
    };
  }, [processWebSocketData]);

  if (!networkData || !modelMetadata) return <LoadingComponent />;

  return (
    <div className="flex overflow-y-hidden max-h-screen">
      {/* Sidebar */}
      <section className="overflow-scroll overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-300 no-scrollbar">
        <Sidebar
          modelMetadata={modelMetadata}
          currentEpoch={currentEpoch}
          meta={metaData}
        />
        <SliderControls
          layerSpacing={layerSpacing}
          setLayerSpacing={setLayerSpacing}
          neuronSpacing={neuronSpacing}
          setNeuronSpacing={setNeuronSpacing}
          nodeSize={nodeSize}
          setNodeSize={setNodeSize}
        />
      </section>

      {/* Neural Network Visualization */}
      <div className="flex-1 max-h-screen max-w-full w-full">
        <Canvas
          // gl={{ clearColor: "black" }}
          camera={{ fov: 50, position: [0, 0, 50] }}
          // style={{ background: 'black' }}
        >
          <Stats />
          <OrbitControls enableDamping dampingFactor={0.1} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />

          {/* Render the input image as the first layer */}
          {networkInputData && (
            <InputImageVisualizer 
              position={[0, 0, 0]}
              inputImage={networkInputData}
            />
          )}

          {/* Render network layers using memoized components */}
          {networkData.map((layer, layerIndex) => (
            <LayerVisualizer
              key={`layer-${layerIndex}`}
              layer={layer}
              layerIndex={layerIndex + 1}
              nextLayer={
                layerIndex < networkData.length - 1
                  ? networkData[layerIndex + 1]
                  : null
              }
              layerSpacing={layerSpacing}
              neuronSpacing={neuronSpacing}
              nodeSize={nodeSize}
              colors={LAYER_COLORS}
            />
          ))}
        </Canvas>
      </div>
    </div>
  );
};

export default NeuralNetwork;
