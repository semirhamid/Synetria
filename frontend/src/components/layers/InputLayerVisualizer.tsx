import React from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { NetworkInput } from '../types';

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
        <div style={{ fontSize: '12px' }}>{`Resolution: ${width}x${height}`}</div>
        <div style={{ fontSize: '12px' }}>{`Channels: ${channels}`}</div>
      </>
    );

    content = (
      <mesh>
        <planeGeometry args={[planeWidth, planeHeight]} />
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
      </mesh>
    );
  } else if (inputData.type === 'vector') {
    // Handle vector type input (for dense networks)
    const vectorLength = inputData.data.flat(2).length;

    dimensions = (
      <div style={{ fontSize: '12px' }}>{`Vector Length: ${vectorLength}`}</div>
    );

    // Simple representation for vector input
    content = (
      <group>
        {inputData.data.flat(2).map((value, idx) => (
          <mesh key={idx} position={[0, idx * 0.5 - (vectorLength * 0.5 * 0.5), 0]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color={new THREE.Color(value, value, value)} />
          </mesh>
        ))}
      </group>
    );
  } else {
    // Generic placeholder for other input types
    dimensions = <div style={{ fontSize: '12px' }}>Unknown input format</div>;
    content = (
      <mesh>
        <boxGeometry args={[2, 2, 0.1]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    );
  }

  return (
    <group position={position}>
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
            boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ fontSize: '12px' }}>Input Layer</div>
          {dimensions}
        </div>
      </Html>

      {content}
    </group>
  );
};

export default InputLayerVisualizer;