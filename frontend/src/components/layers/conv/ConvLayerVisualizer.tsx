import React, { useState, useMemo } from 'react';
import { Html, Text } from '@react-three/drei';

import { LayerData, FeatureMap } from '../../types';
import { FeatureMapMesh } from './FeatureMapVisualizer';
import { viridisColormap } from '../../../utils/visualization3d';

interface ConvLayerVisualizerProps {
  layer: LayerData;
  layerIndex: number;
  nextLayer: LayerData | null;
  layerSpacing: number;
  nodeSize: number;
  colors: string[];
}

const ConvLayerVisualizer: React.FC<ConvLayerVisualizerProps> = ({
  layer,
  layerIndex,
  layerSpacing,
  colors,
}) => {
  const [hoveredMap, setHoveredMap] = useState<number | null>(null);
  const layerColor = colors[layerIndex % colors.length];

  const layerPosition = useMemo<[number, number, number]>(
    () => [layerIndex * layerSpacing, 0, 0],
    [layerIndex, layerSpacing]
  );

  const { feature_maps, kernel_size, in_channels, out_channels } = layer;

  // Memoize constants for feature map layout
  const layoutConfig = useMemo(
    () => ({
      mapSize: 5, // Size of each feature map
      mapSpacing: 0.8, // Spacing between maps
      // mapsPerColumn: feature_maps ? feature_maps.length : 0, // Number of maps to display per column
      mapsPerColumn: feature_maps ? feature_maps.length / 2 : 0,
    }),
    [feature_maps]
  );

  // Memoize feature map positions
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
          }}
        >
          <div
            style={{ fontSize: '12px' }}
          >{`layer : ${layer.layer_name}`}</div>
          <div style={{ fontSize: '12px' }}>{`type: ${layer.type}`}</div>
          <div style={{ fontSize: '11px' }}>
            {kernel_size ? `kernel: ${kernel_size[0]}x${kernel_size[1]}` : ''}
            {in_channels && out_channels
              ? `, ${in_channels}→${out_channels}`
              : ''}
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
                  color={layerColor}
                  onHover={handleFeatureMapHover}
                  index={mapIndex}
                  isHovered={hoveredMap === mapIndex}
                  colormap={viridisColormap}
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
            color={layerColor}
            anchorX="center"
            anchorY="middle"
          >
            No feature maps available
          </Text>

          {/* Placeholder box */}
          <mesh>
            <boxGeometry args={[3, 3, 3]} />
            <meshBasicMaterial
              color={layerColor}
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

export default ConvLayerVisualizer;
