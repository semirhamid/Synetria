import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';

import LoadingComponent from './LoadingComponent';
import { Sidebar, SliderControls } from './SideBar';
import LayerVisualizer from './layers/LayerVisualizer';
import { InputImageVisualizer } from './layers/conv/InputImage';

import {
  DEFAULT_LAYER_SPACING,
  DEFAULT_NEURON_SPACING,
  DEFAULT_NODE_SIZE,
  LAYER_COLORS,
} from '../constants';
import useNeuralNetworkData from '../hooks/useNeuralNetworkData';
import { createTextureFromImg } from '../utils/visualization3d';

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

  const inputImageTexture = useMemo(() => {
    if (networkInputData && networkInputData.type === 'image') {
      const height = networkInputData.data.length;
      const width = networkInputData.data[0]?.length || 0;
      const channels = networkInputData.data[0].length || 1;

      // return createTextureFromImg(networkInputData.data);
      return {
        texture: createTextureFromImg(networkInputData.data),
        height: height,
        width: width,
        channels: channels,
      };
    }
    return null;
  }, [networkInputData]);

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
          camera={{ fov: 50, position: [0, 0, 50] }}
          // style={{ background: 'black' }}
        >
          <Stats />
          <OrbitControls enableDamping dampingFactor={0.1} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />

          {/* Render the input image as the first layer */}
          {networkInputData && inputImageTexture && (
            <InputImageVisualizer
              position={[0, 0, 0]}
              inputImageTexture={inputImageTexture.texture}
              width={inputImageTexture.width}
              height={inputImageTexture.height}
              channels={inputImageTexture.channels}
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
              inputImageTextureMap={inputImageTexture ? inputImageTexture.texture : null}
            />
          ))}
        </Canvas>
      </div>
    </div>
  );
};

export default NeuralNetwork;
