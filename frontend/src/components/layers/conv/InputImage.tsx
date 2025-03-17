import React from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

interface InputImageVisualizerProps {
  position: [number, number, number];
  inputImageTexture: THREE.Texture;
  width: number;
  height: number;
  channels: number;
}

export const InputImageVisualizer: React.FC<InputImageVisualizerProps> = ({
  position,
  inputImageTexture,
  width,
  height,
  channels,
}) => {
  const aspectRatio = width / height;
  const maxDimension = 4;

  const planeWidth =
    aspectRatio > 1 ? maxDimension : maxDimension * aspectRatio;
  const planeHeight =
    aspectRatio > 1 ? maxDimension / aspectRatio : maxDimension;

  const texture = inputImageTexture;
  texture.colorSpace = THREE.SRGBColorSpace;

  return (
    <>
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
            <div
              style={{ fontSize: '12px' }}
            >{`Resolution: ${width}x${height}`}</div>
            <div style={{ fontSize: '12px' }}>{`Channels: ${channels}`}</div>
          </div>
        </Html>

        <mesh>
          <planeGeometry args={[planeWidth, planeHeight]} />
          <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </>
  );
};
