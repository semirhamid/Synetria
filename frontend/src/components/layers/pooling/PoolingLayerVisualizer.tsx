import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LayerData } from '../../types';
import { Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import { createTextureFromGrayscaleImg, viridisColormap } from '../../../utils/visualization3d';

interface PoolingLayerVisualizerProps {
  layer: LayerData;
  layerIndex: number;
  nextLayer: LayerData | null;
  layerSpacing: number;
  nodeSize: number;
  colors: string[];
}

// Update the feature maps handling to match the expected structure
interface FeatureMap {
  channel_id: number;
  activation_map: number[][];
}

interface FeatureMapMeshProps {
  featureMap: FeatureMap;
  position: [number, number, number];
  size: number;
  color: string;
  poolType: string | undefined;
  onHover: (isHovered: boolean, index: number) => void;
  index: number;
  isHovered: boolean;
}

// Separate component for a single feature map mesh - optimized with memo
const FeatureMapMesh = React.memo(({ 
  featureMap, 
  position, 
  size, 
  color, 
  // poolType,
  onHover, 
  index,
  // isHovered 
}: FeatureMapMeshProps) => {
  // Create a ref to the material so we can update its texture
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  
  // Effect to update the texture when the feature map data changes
  useEffect(() => {
    if (materialRef.current && featureMap.activation_map) {
      const texture = createTextureFromGrayscaleImg(featureMap.activation_map, viridisColormap);

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
      
      {/* Pooling operation indicator
      <mesh position={[size/2 - 0.5, size/2 - 0.5, 0.1]} scale={0.3}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color={poolType === 'max' ? 'red' : 'blue'} />
      </mesh> */}
    </group>
  );
});

/**
 * Visualizes a pooling layer in 3D space
 * Displays feature maps and layer information
 */
const PoolingLayerVisualizer: React.FC<PoolingLayerVisualizerProps> = ({
  layer,
  layerIndex,
  layerSpacing,
  colors,
}) => {
  const [hoveredMap, setHoveredMap] = useState<number | null>(null);
  
  // Memoize the layer position
  const layerPosition = useMemo<[number, number, number]>(() => 
    [layerIndex * layerSpacing, 0, 0],
  [layerIndex, layerSpacing]);
  
  // Extract pooling layer properties
  const {
    pool_size,
    pool_stride,
    pool_type,
    feature_maps,
  } = layer;
  
  // Memoize constants for feature map layout
  const layoutConfig = useMemo(() => ({
    mapSize: 5, // Size of each feature map
    mapSpacing: 0.8, // Spacing between maps
    // mapsPerColumn: feature_maps ? feature_maps.length : 0, // Number of maps to display per column
    mapsPerColumn: feature_maps ? feature_maps.length / 2 : 0,
  }), [feature_maps]);
  
  // Get the pooling layer color based on type
  const getPoolingColor = useMemo(() => {
    const baseColor = colors[layerIndex % colors.length];
    // Use a different shade based on pooling type
    if (pool_type === 'max') {
      return baseColor;
    } else if (pool_type === 'avg') {
      // Lighten the color for avg pooling
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
      
      const zPos = -column * 2;
      const yPos = -row * (mapSize + mapSpacing) + (mapsPerColumn * (mapSize + mapSpacing)) / 2 - mapSize;
      const xPos = column * (mapSize + mapSpacing) - 2;
      
      return [xPos, yPos, zPos] as [number, number, number];
    });
  }, [feature_maps, layoutConfig]);
  
  // Handler for hover events
  const handleFeatureMapHover = (isHovered: boolean, index: number) => {
    setHoveredMap(isHovered ? index : null);
  };
  // console.log("pool layer", layer)
  
  return (
    <group position={layerPosition}>
      {/* Layer label */}
      <Html position={[0, 8, 0]}>
        <div style={{ 
          background: 'rgba(0,0,0,0.7)', 
          color: 'white', 
          padding: '8px', 
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 'bold',
          textAlign: 'center',
          minWidth: '100px',
          width: '100%',
        }}>
          <div style={{fontSize: '12px'}}>{`layer : ${layer.layer_name}`}</div>
          <div style={{fontSize: '12px'}}>{`type: ${layer.type}`}</div>
          <div style={{fontSize: '12px'}}>{`pool type: ${pool_type}`}</div>
          <div style={{ fontSize: '12px' }}>
            {pool_type && pool_size ? `${pool_type} ${pool_size[0]}x${pool_size[1]}` : ''}
            {pool_stride ? `, stride ${pool_stride[0]}x${pool_stride[1]}` : ''}
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
                color={getPoolingColor}
                poolType={pool_type}
                onHover={handleFeatureMapHover}
                index={mapIndex}
                isHovered={hoveredMap === mapIndex}
              />
              
              {/* Hover information tooltip */}
              {hoveredMap === mapIndex && (
                <Html position={[featureMapPositions[mapIndex][0], featureMapPositions[mapIndex][1], featureMapPositions[mapIndex][2] + 0.1]}>
                  <div style={{
                    background: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '5px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    pointerEvents: 'none',
                    transform: 'translate(-50%, -50%)',
                    width: '120px',
                    textAlign: 'center'
                  }}>
                    <div>Channel: {featureMap.channel_id}</div>
                    <div>Size: {featureMap.activation_map[0].length}x{featureMap.activation_map.length}</div>
                    <div>Pool: {pool_type} {pool_size ? `${pool_size[0]}x${pool_size[1]}` : ''}</div>
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