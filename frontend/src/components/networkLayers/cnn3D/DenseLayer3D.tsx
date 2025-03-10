import React, { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface DenseLayer3DProps {
  position: [number, number, number];
  name: string;
  outputSize: number;
  weights: number[][];
}

export const DenseLayer3D: React.FC<DenseLayer3DProps> = ({ position, name, outputSize, weights }) => {
  // Calculate dimensions
  const height = 1;
  const nodeSpacing = height / Math.max(outputSize, 1);
  const nodeSize = Math.min(0.05, nodeSpacing * 0.8);
  
  // Calculate weight statistics for visualization
  const weightStats = useMemo(() => {
    let minWeight = Infinity;
    let maxWeight = -Infinity;
    
    // Find min and max weights
    weights.forEach(neuronWeights => {
      neuronWeights.forEach(weight => {
        minWeight = Math.min(minWeight, weight);
        maxWeight = Math.max(maxWeight, weight);
      });
    });
    
    // Calculate average activation per neuron
    const neuronActivations = weights.map(neuronWeights => {
      const sum = neuronWeights.reduce((acc, weight) => acc + Math.abs(weight), 0);
      return sum / neuronWeights.length;
    });
    
    // Find min and max activations for normalization
    let minActivation = Math.min(...neuronActivations);
    let maxActivation = Math.max(...neuronActivations);
    
    // Avoid division by zero
    const activationRange = maxActivation - minActivation || 1;
    
    // Normalize activations to 0-1 range
    const normalizedActivations = neuronActivations.map(
      act => (act - minActivation) / activationRange
    );
    
    return {
      minWeight,
      maxWeight,
      normalizedActivations
    };
  }, [weights]);
  
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
        {name} (Dense)
      </Text>
      
      {/* Layer info */}
      <Text
        position={[0, 1.2, 0]}
        color="black"
        fontSize={0.1}
        anchorX="center"
        anchorY="middle"
      >
        Neurons: {outputSize}
      </Text>
      
      {/* Neurons */}
      <group position={[0, 0, 0]}>
        {Array.from({ length: Math.min(outputSize, 20) }).map((_, index) => {
          // Calculate position
          const y = (index / Math.min(outputSize, 20)) * height - height / 2 + nodeSize / 2;
          
          // Get activation for this neuron (or use default if index is out of bounds)
          const activation = index < weightStats.normalizedActivations.length
            ? weightStats.normalizedActivations[index]
            : 0.5;
          
          // Color based on activation (blue to red gradient)
          const color = new THREE.Color().setHSL(
            (1 - activation) * 0.6, // Hue: 0.6 (blue) to 0 (red)
            0.8,                    // Saturation
            0.5 + activation * 0.3  // Lightness
          );
          
          return (
            <group key={index} position={[0, y, 0]}>
              {/* Neuron */}
              <mesh>
                <sphereGeometry args={[nodeSize, 16, 16]} />
                <meshStandardMaterial color={color} />
              </mesh>
              
              {/* Neuron index */}
              {index % 5 === 0 && (
                <Text
                  position={[nodeSize * 1.5, 0, 0]}
                  color="black"
                  fontSize={0.05}
                  anchorX="left"
                  anchorY="middle"
                >
                  {index}
                </Text>
              )}
            </group>
          );
        })}
        
        {/* Show ellipsis if we're not showing all neurons */}
        {outputSize > 20 && (
          <Text
            position={[0, -height / 2 - 0.1, 0]}
            color="black"
            fontSize={0.1}
            anchorX="center"
            anchorY="top"
          >
            ... ({outputSize - 20} more)
          </Text>
        )}
      </group>
    </group>
  );
}; 