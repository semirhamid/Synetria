import React from 'react';
import * as THREE from 'three';
import {
  createTextureFromGrayscaleImg,
} from '../../../utils/visualization3d';
import { jetColormap } from '../../../utils/heatmaps';

interface CamVisualizerProps {
  position: [number, number, number];
  inputImageTexture: THREE.Texture;
  size: number;
  cam: number[][];
}

/**
 * Component to visualize GradCAM (Gradient-weighted Class Activation Mapping)
 * A technique for visualizing the regions of the image that are important for the network's decision.
 * It overlays a heatmap over the original image to show activation hotspots.
 */
export const CamVisualizer: React.FC<CamVisualizerProps> = ({
  position,
  inputImageTexture,
  size,
  cam,
}) => {
  // Load the CAM Texture
  const camTexture = createTextureFromGrayscaleImg(cam, jetColormap);
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
