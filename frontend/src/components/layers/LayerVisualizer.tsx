import React from 'react';
import * as THREE from 'three';

import { LayerData } from '../types';

import DenseLayerVisualizer from './dense/DenseLayerVisualizer';
import ConvLayerVisualizer from './conv/ConvLayerVisualizer';
import PoolingLayerVisualizer from './conv/PoolingLayerVisualizer';

interface LayerVisualizerProps {
  layer: LayerData;
  layerIndex: number;
  nextLayer: LayerData | null;
  layerSpacing: number;
  neuronSpacing: number;
  nodeSize: number;
  colors: string[];
  inputImageTextureMap: THREE.Texture | null;
}

const LayerVisualizer: React.FC<LayerVisualizerProps> = React.memo(
  ({
    layer,
    layerIndex,
    nextLayer,
    layerSpacing,
    neuronSpacing,
    nodeSize,
    colors,
    inputImageTextureMap,
  }: {
    layer: LayerData;
    layerIndex: number;
    nextLayer: LayerData | null;
    layerSpacing: number;
    neuronSpacing: number;
    nodeSize: number;
    colors: string[];
    inputImageTextureMap: THREE.Texture | null;
  }) => {
    const layerType = layer.type.toLowerCase();

    switch (layerType) {
      case 'linear':
      case 'dense':
        return (
          <DenseLayerVisualizer
            key={`layer-${layerIndex}`}
            layer={layer}
            layerIndex={layerIndex}
            nextLayer={nextLayer}
            layerSpacing={layerSpacing}
            neuronSpacing={neuronSpacing}
            nodeSize={nodeSize}
            colors={colors}
          />
        );
      case 'conv2d':
      case 'conv':
      case 'convolution':
        return (
          <ConvLayerVisualizer
            key={`layer-${layerIndex}`}
            layer={layer}
            layerIndex={layerIndex}
            nextLayer={nextLayer}
            layerSpacing={layerSpacing}
            nodeSize={nodeSize}
            colors={colors}
            inputImageTexture={inputImageTextureMap}
          />
        );
      case 'maxpool2d':
      case 'avgpool2d':
      case 'maxpool':
      case 'avgpool':
      case 'pool':
        return (
          <PoolingLayerVisualizer
            key={`layer-${layerIndex}`}
            layer={layer}
            layerIndex={layerIndex}
            nextLayer={nextLayer}
            layerSpacing={layerSpacing}
            nodeSize={nodeSize}
            colors={colors}
          />
        );
      default:
        console.warn(`Unsupported layer type: ${layer.type}`);
        return null;
    }
  }
);

export default LayerVisualizer;
