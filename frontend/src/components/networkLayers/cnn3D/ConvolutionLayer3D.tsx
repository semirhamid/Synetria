import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { ConvLayerData, FeatureMapData } from '../../types';
import { createTextureFromData, heatmapColormap } from '../../../utils/visualization3d';

interface ConvolutionLayer3DProps {
  position: [number, number, number];
  layer: ConvLayerData;
}

export const ConvolutionLayer3D: React.FC<ConvolutionLayer3DProps> = ({ position, layer }) => {
  // Extract dimensions and properties
  const { feature_maps, kernel_size, stride, padding, output_shape } = layer;
  const numFeatureMaps = feature_maps.length;
  
  // Calculate grid layout for feature maps
  const gridSize = Math.ceil(Math.sqrt(numFeatureMaps));
  const spacing = 0.1;
  const mapSize = 0.8 / gridSize;
  
  // Create textures for each feature map
  const featureMapTextures = useMemo(() => {
    return feature_maps.map((featureMap) => {
      return createTextureFromData(featureMap.activation_map, heatmapColormap);
    });
  }, [feature_maps]);
  
  return (
    <group position={position}>
      {/* Layer label */}
      <Text
        position={[0, 1.5, 0]}
        color="black"
        fontSize={0.2}
        anchorX="center"
        anchorY="middle"
      >
        {layer.layer_name} ({output_shape[0]}x{output_shape[1]}x{output_shape[2]})
      </Text>
      
      {/* Layer info */}
      <Text
        position={[0, 1.2, 0]}
        color="black"
        fontSize={0.1}
        anchorX="center"
        anchorY="middle"
      >
        Kernel: {kernel_size[0]}x{kernel_size[1]}, Stride: {stride[0]}x{stride[1]}
      </Text>
      
      {/* Feature maps grid */}
      <group position={[0, 0, 0]}>
        {feature_maps.map((featureMap, index) => {
          const row = Math.floor(index / gridSize);
          const col = index % gridSize;
          
          // Calculate position in grid
          const x = (col - gridSize / 2 + 0.5) * (mapSize + spacing);
          const y = (gridSize / 2 - row - 0.5) * (mapSize + spacing);
          
          return (
            <mesh key={index} position={[x, y, 0]}>
              <planeGeometry args={[mapSize, mapSize]} />
              <meshStandardMaterial 
                map={featureMapTextures[index]} 
                side={THREE.DoubleSide}
              />
              
              {/* Feature map index */}
              <Text
                position={[0, 0, 0.01]}
                color="white"
                fontSize={0.05}
                anchorX="center"
                anchorY="middle"
                backgroundColor="rgba(0,0,0,0.5)"
                padding={0.01}
              >
                {index}
              </Text>
            </mesh>
          );
        })}
      </group>
    </group>
  );
}; 