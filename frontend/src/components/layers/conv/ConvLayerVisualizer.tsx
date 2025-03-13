import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LayerData } from '../../types';
import { Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import { createTextureFromData, heatmapColormap } from '../../../utils/visualization3d';

interface ConvLayerVisualizerProps {
  layer: LayerData;
  layerIndex: number;
  nextLayer: LayerData | null;
  layerSpacing: number;
  nodeSize: number;
  colors: string[];
}

interface FeatureMap {
  channel_id: number;
  activation_map: number[][];
}

interface FeatureMapMeshProps {
  featureMap: FeatureMap;
  position: [number, number, number];
  size: number;
  color: string;
  onHover: (isHovered: boolean, index: number) => void;
  index: number;
  isHovered: boolean;
}

const FeatureMapMesh = React.memo(({ 
  featureMap, 
  position, 
  size, 
  color, 
  onHover, 
  index,
  // isHovered 
}: FeatureMapMeshProps) => {
  // Create a ref to the material so we can update its texture on incoming new data, instead of re-rendering the entire mesh.
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  
  useEffect(() => {
    if (materialRef.current && featureMap.activation_map) {
      const texture = createTextureFromData(featureMap.activation_map, heatmapColormap);
      if (texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
        materialRef.current.map = texture;
        materialRef.current.needsUpdate = true;
      }
    }
  }, [featureMap.activation_map]);

  return (
    <group position={position}>
      {/* Feature map visualization */}
      <mesh
        onPointerOver={() => onHover(true, index)}
        onPointerOut={() => onHover(false, index)}
      >
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial
          ref={materialRef}
          side={THREE.DoubleSide}
          // transparent={!isHovered}
          // opacity={isHovered ? 1 : 0.8}
        />
      </mesh>
      
      {/* Channel label */}
      <Text
        position={[0, size/2 + 0.3, 0]}
        fontSize={0.3}
        color={color}
        anchorX="center"
        anchorY="bottom"
      >
        {`Channel ${featureMap.channel_id}`}
      </Text>
    </group>
  );
});

/**
 * Visualizes a convolutional layer in 3D space
 * Displays feature maps and layer information
 */
const ConvLayerVisualizer: React.FC<ConvLayerVisualizerProps> = ({
  layer,
  layerIndex,
  layerSpacing,
  colors,
}) => {
  const [hoveredMap, setHoveredMap] = useState<number | null>(null);
  const layerColor = colors[layerIndex % colors.length];

  // Calculate layer position in 3D space - memoized
  const layerPosition = useMemo<[number, number, number]>(() => 
    [layerIndex * layerSpacing, 0, 0],
  [layerIndex, layerSpacing]);

  // Extract convolutional layer properties
  const {
    feature_maps,
    kernel_size,
    in_channels,
    out_channels,
  } = layer;

  // Memoize constants for feature map layout
  const layoutConfig = useMemo(() => ({
    mapSize: 2.5, // Size of each feature map
    mapSpacing: 0.5, // Spacing between maps
    mapsPerColumn: feature_maps ? feature_maps.length : 0, // Number of maps to display per column
  }), [feature_maps]);

  // Memoize feature map positions for performance
  const featureMapPositions = useMemo(() => {
    const { mapSize, mapSpacing, mapsPerColumn } = layoutConfig;
    
    if (!feature_maps || feature_maps.length === 0) return [];

    return (feature_maps as unknown as FeatureMap[]).map((_, mapIndex) => {
      const column = Math.floor(mapIndex / mapsPerColumn);
      const row = mapIndex % mapsPerColumn;
      
      const zPos = 0;
      const yPos = -row * (mapSize + mapSpacing) + (mapsPerColumn * (mapSize + mapSpacing)) / 2 - mapSize;
      const xPos = column * (mapSize + mapSpacing) - 2;
      
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
            width: '150px',
          }}
        >
          <div>{layer.layer_name}</div>
          <div style={{ fontSize: '12px' }}>
            {kernel_size ? `${kernel_size[0]}x${kernel_size[1]} kernel` : ''}
            {in_channels && out_channels
              ? `, ${in_channels}→${out_channels}`
              : ''}
          </div>
        </div>
      </Html>

      {/* Feature Maps Visualization */}
      {feature_maps && feature_maps.length > 0 && (
        <group>
          {(feature_maps as unknown as FeatureMap[]).map((featureMap, mapIndex) => (
            <React.Fragment key={`feature-map-${mapIndex}`}>
              <FeatureMapMesh
                featureMap={featureMap}
                position={featureMapPositions[mapIndex]}
                size={layoutConfig.mapSize}
                color={layerColor}
                onHover={handleFeatureMapHover}
                index={mapIndex}
                isHovered={hoveredMap === mapIndex}
              />
              
              {/* Hover information tooltip */}
              {hoveredMap === mapIndex && (
                <Html position={[featureMapPositions[mapIndex][0], featureMapPositions[mapIndex][1], featureMapPositions[mapIndex][2] + 0.1]}>
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
          ))}
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
