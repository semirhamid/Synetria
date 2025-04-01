import React, { useMemo } from 'react';

import { PoolingLayerData, LayerData, FeatureMap } from '../layers.types';
import { InstancedFeatureMapMesh } from '../common/InstancedFeatureMapVisualizer';
import { jetColormap } from '../../../utils/heatmaps';
import LayerInfoTooltip from '../Tooltip';
import { createFeatureMapLayout } from '@/utils/layerLayout';

interface PoolingLayerVisualizerProps {
  layer: PoolingLayerData;
  layerIndex: number;
  nextLayer: LayerData | null;
  layerSpacing: number;
  nodeSize: number;
}

interface Layout {
  featureMapSize: number;
  featureMapSpacing: number;
  featureMapsPerRow: number;
  layerPosition: [number, number, number];
}

const PoolingLayerVisualizer: React.FC<PoolingLayerVisualizerProps> = ({
  layer,
  layerIndex,
  layerSpacing,
}) => {
  const { kernel_size, stride, pool_type, feature_maps, layer_name } = layer;

  const layout = useMemo<Layout>(
    () =>
      createFeatureMapLayout(
        layerIndex,
        layerSpacing,
        feature_maps?.length || 0
      ),
    [layerIndex, layerSpacing, feature_maps]
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


  const tooltipPosition = useMemo<[number, number, number]>(() => {
    const leftEdge = ((layout.featureMapsPerRow / 2) + 1) * layout.featureMapSize;
    return [-leftEdge, layout.featureMapSize + 1 / 2, 0];
  }, [layout.featureMapSize, layout.featureMapsPerRow]);

  return (
    <group position={layout.layerPosition}>
      {/* Layer label */}
      <LayerInfoTooltip position={tooltipPosition}>
        <div style={{ fontWeight: 'bold' }}>{layer_name}</div>
        <div>type: {layer.type}</div>
        <div>pool type: {pool_type}</div>
        {pool_type && kernel_size && (
          <div>
            size: {kernel_size[0]}x{kernel_size[1]}
            {stride && `, stride ${stride[0]}x${stride[1]}`}
          </div>
        )}
      </LayerInfoTooltip>

      {feature_maps && (
        <InstancedFeatureMapMesh
          featureMaps={feature_maps}
          mapPositions={featureMapPositions}
          size={layout.featureMapSize}
          colormap={jetColormap}
        />
      )}
    </group>
  );
};

export default PoolingLayerVisualizer;
