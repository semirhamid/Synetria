import React, { useRef, useEffect } from 'react';

import * as THREE from 'three';
import { Text } from '@react-three/drei';

import { FeatureMap } from '../../types';
import { createTextureFromData } from '../../../utils/visualization3d';

interface FeatureMapMeshProps {
  featureMap: FeatureMap;
  position: [number, number, number];
  size: number;
  color: string;
  onHover: (isHovered: boolean, index: number) => void;
  index: number;
  colormap: (value: number) => [number, number, number];
  isHovered: boolean;
}

const FeatureMapMesh = React.memo(
  ({
    featureMap,
    position,
    size,
    color,
    onHover,
    index,
    colormap,
    // isHovered
  }: FeatureMapMeshProps) => {
    // Create a ref to the material so we can update its texture on incoming new data, instead of re-rendering the entire mesh.
    const materialRef = useRef<THREE.MeshBasicMaterial>(null);

    useEffect(() => {
      if (materialRef.current && featureMap.activation_map) {
        const texture = createTextureFromData(
          featureMap.activation_map,
          colormap
        );
        if (texture) {
          texture.colorSpace = THREE.SRGBColorSpace;
          materialRef.current.map = texture;
          materialRef.current.needsUpdate = true;
        }
      }
    }, [featureMap.activation_map, colormap]);

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
          position={[0, size / 2 + 0.3, 0]}
          fontSize={0.3}
          color={color}
          anchorX="center"
          anchorY="bottom"
        >
          {`Channel ${featureMap.channel_id}`}
        </Text>
      </group>
    );
  }
);

export type { FeatureMap };
export { FeatureMapMesh };
