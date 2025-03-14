import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

interface InputImageVisualizerProps {
  position: [number, number, number];
  inputImage: number[][][];
}

export const InputImageVisualizer: React.FC<InputImageVisualizerProps> = ({
  position,
  inputImage,
}) => {
  const height = inputImage.length;
  const width = inputImage[0]?.length || 0;
  const channels = inputImage[0]?.[0]?.length || 1;


  // console.table({ channels, width, height });

  const aspectRatio = width / height;
  const maxDimension = 4;
  const planeWidth =
    aspectRatio > 1 ? maxDimension : maxDimension * aspectRatio;
  const planeHeight =
    aspectRatio > 1 ? maxDimension / aspectRatio : maxDimension;

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    if (!ctx || height === 0 || width === 0) return new THREE.Texture();

    const imageData = ctx.createImageData(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;

        if (channels === 1) {
          const value = Math.floor(inputImage[y][x][0] * 255);
          imageData.data[i] = value;
          imageData.data[i + 1] = value;
          imageData.data[i + 2] = value;
          imageData.data[i + 3] = value;
        } else if (channels === 3) {
          imageData.data[i] = Math.floor(inputImage[y][x][0] * 255);
          imageData.data[i + 1] = Math.floor(inputImage[y][x][1] * 255);
          imageData.data[i + 2] = Math.floor(inputImage[y][x][2] * 255);
          imageData.data[i + 3] = 255;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [inputImage, width, height, channels]);

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

        {/* <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[planeWidth + 0.2, planeHeight + 0.2]} />
          <meshBasicMaterial color="#333333" side={THREE.DoubleSide} />
        </mesh> */}

        <mesh>
          <planeGeometry args={[planeWidth, planeHeight]} />
          <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </>
  );
};
