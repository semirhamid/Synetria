import React from 'react';
import { Text } from '@react-three/drei';

interface FlattenLayer3DProps {
  position: [number, number, number];
  name: string;
  outputSize: number;
}

export const FlattenLayer3D: React.FC<FlattenLayer3DProps> = ({ position, name, outputSize }) => {
  // Calculate dimensions for the visual representation
  const height = 1;
  const width = 0.1;
  
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
        {name} (Flatten)
      </Text>
      
      {/* Layer info */}
      <Text
        position={[0, 1.2, 0]}
        color="black"
        fontSize={0.1}
        anchorX="center"
        anchorY="middle"
      >
        Output: {outputSize}
      </Text>
      
      {/* Visual representation of flattening */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width, height, 0.05]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>
      
      {/* Arrows indicating flattening direction */}
      <group position={[-0.2, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.2, 0.02, 0.02]} />
          <meshStandardMaterial color="#4b5563" />
        </mesh>
        <mesh rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.2, 0.02, 0.02]} />
          <meshStandardMaterial color="#4b5563" />
        </mesh>
      </group>
      
      {/* Output representation */}
      <group position={[0.3, 0, 0]}>
        {/* Create a series of small boxes to represent the flattened vector */}
        {Array.from({ length: Math.min(20, outputSize) }).map((_, index) => {
          const y = (index / 20) * height - height / 2 + height / 40;
          return (
            <mesh key={index} position={[0, y, 0]}>
              <boxGeometry args={[width, height / 20 - 0.01, 0.05]} />
              <meshStandardMaterial color={`hsl(${(index / 20) * 180 + 180}, 70%, 60%)`} />
            </mesh>
          );
        })}
      </group>
      
      {/* Connection lines */}
      <mesh position={[0.15, 0, 0]}>
        <boxGeometry args={[0.2, 0.01, 0.01]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>
    </group>
  );
}; 