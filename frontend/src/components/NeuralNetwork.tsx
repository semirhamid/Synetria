import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import * as THREE from 'three';

import LoadingComponent from './LoadingComponent';
import { Sidebar, SliderControls } from './SideBar';
import DenseLayerVisualizer from './layers/dense/DenseLayerVisualizer';
import ConvLayerVisualizer from './layers/conv/ConvLayerVisualizer';
import PoolingLayerVisualizer from './layers/conv/PoolingLayerVisualizer';
import InputLayerVisualizer from './layers/InputLayerVisualizer';

import {
  DEFAULT_LAYER_SPACING,
  DEFAULT_NEURON_SPACING,
  DEFAULT_NODE_SIZE,
  LAYER_COLORS,
} from '../constants';
import useNeuralNetworkData from '../hooks/useNeuralNetworkData';
import { createTextureFromImg } from '../utils/visualization3d';
import { isDenseLayer, isConvLayer, isPoolingLayer, LayerData } from './types';
import { Perf } from 'r3f-perf';

const NeuralNetwork: React.FC = () => {
  const {
    networkInputData,
    networkData,
    modelMetadata,
    metaData,
    currentEpoch,
  } = useNeuralNetworkData();

  const [layerSpacing, setLayerSpacing] = useState(DEFAULT_LAYER_SPACING);
  const [neuronSpacing, setNeuronSpacing] = useState(DEFAULT_NEURON_SPACING);
  const [nodeSize, setNodeSize] = useState(DEFAULT_NODE_SIZE);

  const inputImageTexture = useMemo<THREE.Texture | null>(() => {
    if (networkInputData && networkInputData.type === 'image') {
      return createTextureFromImg(networkInputData.data);
    }
    return null;
  }, [networkInputData]);

  if (!networkData || !modelMetadata) return <LoadingComponent />;

  // Function to render the correct layer component based on layer type
  const renderLayerComponent = (
    layer: LayerData,
    layerIndex: number,
    nextLayer: LayerData | null
  ) => {
    if (isDenseLayer(layer)) {
      return (
        <DenseLayerVisualizer
          key={`layer-${layerIndex}`}
          layer={layer}
          layerIndex={layerIndex}
          nextLayer={nextLayer}
          layerSpacing={layerSpacing}
          neuronSpacing={neuronSpacing}
          nodeSize={nodeSize}
          colors={LAYER_COLORS}
        />
      );
    } else if (isConvLayer(layer)) {
      return (
        <ConvLayerVisualizer
          key={`layer-${layerIndex}`}
          layer={layer}
          layerIndex={layerIndex}
          nextLayer={nextLayer}
          layerSpacing={layerSpacing}
          nodeSize={nodeSize}
          colors={LAYER_COLORS}
          inputImageTexture={inputImageTexture}
        />
      );
    } else if (isPoolingLayer(layer)) {
      return (
        <PoolingLayerVisualizer
          key={`layer-${layerIndex}`}
          layer={layer}
          layerIndex={layerIndex}
          nextLayer={nextLayer}
          layerSpacing={layerSpacing}
          nodeSize={nodeSize}
          colors={LAYER_COLORS}
        />
      );
    }

    // If we reach here, we have an unknown layer type
    // Using a type assertion to safely access the type property
    const unknownLayer = layer as { type: string };
    console.warn(`Unsupported layer type: ${unknownLayer.type}`);
    return null;
  };

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
          camera={{ fov: 50, position: [0, 0, 50] }}
          // style={{ background: 'black' }}
        >
          {/* <Stats /> */}
          <Perf />
          <OrbitControls enableDamping dampingFactor={0.1} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />

          {/* Render the input layer independently */}
          {networkInputData && (
            <InputLayerVisualizer
              inputData={networkInputData}
              position={[0, 0, 0]}
              texture={inputImageTexture}
            />
          )}

          {/* Render network layers directly based on their type */}
          {networkData.map((layer, layerIndex) => {
            const nextLayer =
              layerIndex < networkData.length - 1
                ? networkData[layerIndex + 1]
                : null;

            return renderLayerComponent(layer, layerIndex + 1, nextLayer);
          })}
        </Canvas>
      </div>
    </div>
  );
};

export default NeuralNetwork;
