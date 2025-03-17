import React from 'react';
import * as THREE from 'three';
import {
  createTextureFromGrayscaleImg,
  greyscaleColormap,
  heatmapColormap,
} from '../../../utils/visualization3d';

interface CamVisualizerProps {
  position: [number, number, number];
  inputImageTexture: THREE.Texture;
  size: number;
  cam: number[][];
}

export const CamVisualizer: React.FC<CamVisualizerProps> = ({
  position,
  inputImageTexture,
  size,
  cam,
}) => {
  console.log(cam);
  // Load the CAM Texture
  const camTexture = createTextureFromGrayscaleImg(cam, heatmapColormap);
  return (
    <>
      <group position={position}>
        <mesh>
          <planeGeometry args={[size, size]} />
          <meshBasicMaterial map={inputImageTexture} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <planeGeometry args={[size, size]} />
          <meshBasicMaterial
            map={camTexture}
            side={THREE.DoubleSide}
            transparent
            opacity={0.6}
          />
        </mesh>
      </group>
    </>
  );
};
