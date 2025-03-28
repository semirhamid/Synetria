import * as THREE from 'three';
import { Html, Text } from '@react-three/drei';
import React, { useState, useMemo } from 'react';

import { LayerData, FeatureMap, PoolingLayerData } from '../../types';
import { FeatureMapMesh } from './FeatureMapVisualizer';
import { jetColormap } from '../../../utils/heatmaps';

interface PoolingLayerVisualizerProps {
  layer: PoolingLayerData;
  layerIndex: number;
  nextLayer: LayerData | null;
  layerSpacing: number;
  nodeSize: number;
  colors: string[];
}

const PoolingLayerVisualizer: React.FC<PoolingLayerVisualizerProps> = ({
  layer,
  layerIndex,
  layerSpacing,
  colors,
}) => {
  const [hoveredMap, setHoveredMap] = useState<number | null>(null);

  const layerPosition = useMemo<[number, number, number]>(
    () => [layerIndex * layerSpacing, 0, 0],
    [layerIndex, layerSpacing]
  );

  const { kernel_size, stride, pool_type, feature_maps } = layer;

  const layoutConfig = useMemo(
    () => ({
      mapSize: 5, // Size of each feature map
      mapSpacing: 0.8, // Spacing between maps
      // mapsPerColumn: feature_maps ? feature_maps.length : 0, // Number of maps to display per column
      mapsPerColumn: feature_maps ? feature_maps.length / 2 : 0,
    }),
    [feature_maps]
  );

  const getPoolingColor = useMemo(() => {
    const baseColor = colors[layerIndex % colors.length];
    if (pool_type === 'max') {
      return baseColor;
    } else if (pool_type === 'avg') {
      return new THREE.Color(baseColor).offsetHSL(0, 0, 0.2).getStyle();
    }
    return baseColor;
  }, [pool_type, colors, layerIndex]);

  // Memoize feature map positions for performance
  const featureMapPositions = useMemo(() => {
    const { mapSize, mapSpacing, mapsPerColumn } = layoutConfig;

    if (!feature_maps || feature_maps.length === 0) return [];

    return (feature_maps as unknown as FeatureMap[]).map((_, mapIndex) => {
      const column = Math.floor(mapIndex / mapsPerColumn);
      const row = mapIndex % mapsPerColumn;

      const xPos = 0;
      const yPos =
        -row * (mapSize + mapSpacing) +
        (mapsPerColumn * (mapSize + mapSpacing)) / 2 -
        mapSize;
      const zPos = column * (mapSize + mapSpacing) - 2;

      return [xPos, yPos, zPos] as [number, number, number];
    });
  }, [feature_maps, layoutConfig]);

  // Handler for hover events
  const handleFeatureMapHover = (isHovered: boolean, index: number) => {
    setHoveredMap(isHovered ? index : null);
  };

  return (
    <group position={layerPosition}>
      {/* Layer label */}
      <Html position={[0, 8, 0]}>
        <div
          style={{
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold',
            textAlign: 'center',
            minWidth: '100px',
            width: '100%',
          }}
        >
          <div
            style={{ fontSize: '12px' }}
          >{`layer : ${layer.layer_name}`}</div>
          <div style={{ fontSize: '12px' }}>{`type: ${layer.type}`}</div>
          <div style={{ fontSize: '12px' }}>{`pool type: ${pool_type}`}</div>
          <div style={{ fontSize: '12px' }}>
            {pool_type && kernel_size
              ? `${pool_type} ${kernel_size[0]}x${kernel_size[1]}`
              : ''}
            {stride ? `, stride ${stride[0]}x${stride[1]}` : ''}
          </div>
        </div>
      </Html>

      {/* Feature Maps Visualization */}
      {feature_maps && feature_maps.length > 0 && (
        <group>
          {(feature_maps as unknown as FeatureMap[]).map(
            (featureMap, mapIndex) => (
              <React.Fragment key={`feature-map-${mapIndex}`}>
                <FeatureMapMesh
                  featureMap={featureMap}
                  position={featureMapPositions[mapIndex]}
                  size={layoutConfig.mapSize}
                  color={getPoolingColor}
                  onHover={handleFeatureMapHover}
                  index={mapIndex}
                  isHovered={hoveredMap === mapIndex}
                  colormap={jetColormap}
                />

                {/* Hover information tooltip */}
                {hoveredMap === mapIndex && (
                  <Html
                    position={[
                      featureMapPositions[mapIndex][0],
                      featureMapPositions[mapIndex][1],
                      featureMapPositions[mapIndex][2] + 0.1,
                    ]}
                  >
                    <div
                      style={{
                        background: 'rgba(0,0,0,0.8)',
                        color: 'white',
                        padding: '5px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        pointerEvents: 'none',
                        transform: 'translate(-50%, -50%)',
                        width: '120px',
                        textAlign: 'center',
                      }}
                    >
                      <div>Channel: {featureMap.channel_id}</div>
                      <div>
                        Size: {featureMap.activation_map[0].length}x
                        {featureMap.activation_map.length}
                      </div>
                      <div>
                        Pool: {pool_type}{' '}
                        {kernel_size ? `${kernel_size[0]}x${kernel_size[1]}` : ''}
                      </div>
                    </div>
                  </Html>
                )}
              </React.Fragment>
            )
          )}
        </group>
      )}

      {/* If no feature maps are available, show a placeholder */}
      {(!feature_maps || feature_maps.length === 0) && (
        <group>
          <Text
            position={[0, 0, 0]}
            fontSize={0.5}
            color={getPoolingColor}
            anchorX="center"
            anchorY="middle"
          >
            No feature maps available
          </Text>

          {/* Placeholder cylinder for pooling layer */}
          <mesh>
            <cylinderGeometry args={[2, 2, 2, 16]} />
            <meshBasicMaterial
              color={getPoolingColor}
              transparent={true}
              opacity={0.3}
              wireframe={true}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};

export default PoolingLayerVisualizer;
