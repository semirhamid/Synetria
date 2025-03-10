import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

interface InputLayer3DProps {
  position: [number, number, number];
  inputImage: number[][][];
}

export const InputLayer3D: React.FC<InputLayer3DProps> = ({ position, inputImage }) => {
  // Calculate dimensions
  const height = inputImage.length;
  const width = inputImage[0]?.length || 0;
  const channels = inputImage[0]?.[0]?.length || 0;
  
  // Create texture from input image
  const texture = useMemo(() => {
    // Create a canvas to draw the image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return new THREE.Texture();
    
    // Create ImageData
    const imageData = ctx.createImageData(width, height);
    
    // Fill the image data
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        if (channels === 1) {
          // Grayscale image
          const value = Math.floor(inputImage[y][x][0] * 255);
          imageData.data[i] = value;
          imageData.data[i + 1] = value;
          imageData.data[i + 2] = value;
          imageData.data[i + 3] = 255; // Alpha
        } else if (channels === 3) {
          // RGB image
          imageData.data[i] = Math.floor(inputImage[y][x][0] * 255);
          imageData.data[i + 1] = Math.floor(inputImage[y][x][1] * 255);
          imageData.data[i + 2] = Math.floor(inputImage[y][x][2] * 255);
          imageData.data[i + 3] = 255; // Alpha
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Create texture
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [inputImage, width, height, channels]);
  
  // Scale the plane to maintain aspect ratio
  const scale = 1;
  const aspectRatio = width / height;
  
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
        Input Layer ({width}x{height}x{channels})
      </Text>
      
      {/* Input image plane */}
      <mesh>
        <planeGeometry args={[scale * aspectRatio, scale]} />
        <meshStandardMaterial map={texture} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}; 