import React, { useState } from 'react';
import { Sphere } from '@react-three/drei';
import { Html } from '@react-three/drei'; // For tooltips in Three.js

interface NodeProps {
  position?: [number, number, number];
  color: string;
  nodeSize?: number;
  bias?: number | null; // Bias is optional
  // 2D rendering props
  x?: number;
  y?: number;
  size?: number;
}

const Node: React.FC<NodeProps> = ({ 
  position, 
  color, 
  nodeSize, 
  bias,
  x,
  y,
  size
}) => {
  const [hovered, setHovered] = useState(false); // Track hover state

  // Check if we're rendering in 2D mode
  const is2D = x !== undefined && y !== undefined;

  if (is2D) {
    // 2D rendering
    return (
      <circle
        cx={x}
        cy={y}
        r={size || 10}
        fill={color}
        stroke="#333"
        strokeWidth={1}
        onMouseOver={() => setHovered(true)}
        onMouseOut={() => setHovered(false)}
      >
        {hovered && (
          <title>Neuron</title>
        )}
      </circle>
    );
  }

  // 3D rendering (original)
  const biasColor = bias
    ? bias < 0
      ? 'red' // Use red for negative biases
      : 'green' // Use green for positive biases
    : color;

  const biasSize = bias ? Math.abs(bias) * (nodeSize || 10) : (nodeSize || 10);

  return (
    <>
      <Sphere
        position={position}
        args={[biasSize, 16, 16]}
        onPointerOver={() => setHovered(true)} // Handle hover start
        onPointerOut={() => setHovered(false)} // Handle hover end
      >
        <meshStandardMaterial color={biasColor} />
        {hovered && bias !== null && (
          <Html
            position={[0, 0, biasSize + 0.1]} // Position the tooltip slightly above the node
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '5px',
              fontSize: '20px',
              whiteSpace: 'nowrap',
            }}
          >
            Bias: {(bias ?? 0).toFixed(2)} {/* Display bias value */}
          </Html>
        )}
      </Sphere>
    </>
  );
};

export default Node;
