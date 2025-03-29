import React, { useMemo } from 'react';
import * as THREE from 'three';

import { LayerData, FeatureMap, ConvLayerData } from '../layers.types';
import { CamVisualizer } from './CamVisualizer';
import { viridisColormap } from '../../../utils/heatmaps';
import LayerInfoTooltip from '../Tooltip';
import { InstancedFeatureMapMesh } from '../common/InstancedFeatureMapVisualizer';

interface ConvLayerVisualizerProps {
  layer: ConvLayerData;
  layerIndex: number;
  nextLayer: LayerData | null;
  layerSpacing: number;
  nodeSize: number;
  colors: string[];
  inputImageTexture: THREE.Texture | null;
}

interface Layout {
  featureMapSize: number;
  featureMapSpacing: number;
  featureMapsPerRow: number;
  layerPosition: [number, number, number];
  layerColor: string;
}

const ConvLayerVisualizer: React.FC<ConvLayerVisualizerProps> = ({
  layer,
  layerIndex,
  layerSpacing,
  colors,
  inputImageTexture,
}) => {
  const {
    layer_name,
    feature_maps,
    kernel_size,
    in_channels,
    out_channels,
    cam,
  } = layer;

  const layout = useMemo<Layout>(
    () => ({
      layerColor: colors[layerIndex % colors.length],
      // layerPosition: [0, 0, -layerIndex * layerSpacing],
      layerPosition: [-layerIndex * layerSpacing , 0, -layerIndex * layerSpacing],
      featureMapSize: 5,
      featureMapSpacing: 0.8,
      featureMapsPerRow: feature_maps
        ? Math.ceil(Math.sqrt(feature_maps.length))
        : 0,
    }),
    [layerIndex, layerSpacing, feature_maps, colors]
  );

  const featureMapPositions: [number, number, number][] = useMemo(() => {
    if (!feature_maps || feature_maps.length === 0) return [];

    const columns = layout.featureMapsPerRow;
    const rows = Math.ceil(feature_maps.length / columns);
    const totalWidth =
      columns * layout.featureMapSize +
      (columns - 1) * layout.featureMapSpacing;
    const totalHeight =
      rows * layout.featureMapSize + (rows - 1) * layout.featureMapSpacing;

    return feature_maps.map((_: FeatureMap, index: number) => {
      const column = index % layout.featureMapsPerRow;
      const row = Math.floor(index / layout.featureMapsPerRow);
      const x =
        column * (layout.featureMapSize + layout.featureMapSpacing) -
        totalWidth / 2 +
        layout.featureMapSize / 2;
      const y =
        row * (layout.featureMapSize + layout.featureMapSpacing) -
        totalHeight / 2 +
        layout.featureMapSize / 2;
      return [x, y, 0];
    });
  }, [feature_maps, layout]);

  const camPosition = useMemo<[number, number, number]>(() => {
    // Position CAM to the left of the first feature map
    // Make sure it's far enough from the layer info tooltip
    return [-12, 0, 0]; // X: -12 (left side, past the tooltip which is at -8)
  }, []);

  return (
    <group position={layout.layerPosition}>
      {/* Layer label */}
      <LayerInfoTooltip position={[-8, 0, 0]}>
        <div style={{ fontWeight: 'bold' }}>{layer_name}</div>
        <div>in: {in_channels}</div>
        <div>out: {out_channels}</div>
        <div>kernel: {kernel_size}</div>
      </LayerInfoTooltip>

      {/* CAM - positioned to the left of feature maps */}
      {cam && inputImageTexture && (
        <CamVisualizer
          cam={cam}
          inputImageTexture={inputImageTexture}
          size={layout.featureMapSize} // Same size as feature maps
          position={camPosition}
        />
      )}

      {/* Feature maps */}
      {feature_maps && (
        <InstancedFeatureMapMesh
          featureMaps={feature_maps}
          mapPositions={featureMapPositions}
          size={layout.featureMapSize}
          colormap={viridisColormap}
          labelColor={layout.layerColor}
        />
      )}
    </group>
  );
};

export default ConvLayerVisualizer;
