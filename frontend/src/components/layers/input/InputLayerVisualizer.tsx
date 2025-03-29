import React from 'react';
import * as THREE from 'three';
import { NetworkInput } from '../../types';
import LayerInfoTooltip from '../Tooltip';

interface InputLayerVisualizerProps {
  inputData: NetworkInput;
  position: [number, number, number];
  texture: THREE.Texture | null;
}

export const InputLayerVisualizer: React.FC<InputLayerVisualizerProps> = ({
  inputData,
  position,
  texture,
}) => {
  // Default dimensions
  const maxDimension = 4;
  
  if (!inputData) {
    return null;
  }

  let content;
  let dimensions;

  if (inputData.type === 'image' && texture) {
    // Handle image type input with texture
    const width = inputData.data[0]?.length || 0;
    const height = inputData.data.length || 0;
    const channels = inputData.data[0]?.[0]?.length || 0;
    const aspectRatio = width / height || 1;

    const planeWidth = aspectRatio > 1 ? maxDimension : maxDimension * aspectRatio;
    const planeHeight = aspectRatio > 1 ? maxDimension / aspectRatio : maxDimension;

    texture.colorSpace = THREE.SRGBColorSpace;

    dimensions = (
      <>
        <div>Resolution: {width}x{height}</div>
        <div>Channels: {channels}</div>
      </>
    );

    content = (
      <mesh>
        <planeGeometry args={[planeWidth, planeHeight]} />
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
      </mesh>
    );
  } else if (inputData.type === 'vector') {
    // Handle vector type input
    const length = inputData.data.length;
    
    dimensions = (
      <div>Vector length: {length}</div>
    );

    content = (
      <mesh>
        <boxGeometry args={[maxDimension, 0.5, 0.5]} />
        <meshBasicMaterial color="blue" transparent opacity={0.7} />
      </mesh>
    );
  } else {
    // Handle unknown input type
    dimensions = (
      <div>Unknown input type</div>
    );

    content = (
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="red" transparent opacity={0.7} />
      </mesh>
    );
  }

  return (
    <group position={position}>
      <LayerInfoTooltip position={[-8, 0, 0]}>
        <div style={{ fontWeight: 'bold' }}>Input Layer</div>
        {dimensions}
      </LayerInfoTooltip>
      {content}
    </group>
  );
};

export default InputLayerVisualizer;