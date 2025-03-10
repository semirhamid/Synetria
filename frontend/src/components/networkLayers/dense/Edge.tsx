import React, { useState } from 'react';
import { Line } from '@react-three/drei';
import { Html } from '@react-three/drei'; // For displaying tooltips

interface EdgeProps {
  sourcePosition?: [number, number, number];
  targetPosition?: [number, number, number];
  weight: number;
  // 2D rendering props
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

const Edge: React.FC<EdgeProps> = ({
  sourcePosition,
  targetPosition,
  weight,
  x1,
  y1,
  x2,
  y2
}) => {
  const [hovered, setHovered] = useState(false); // Track hover state

  // Check if we're rendering in 2D mode
  const is2D = x1 !== undefined && y1 !== undefined && x2 !== undefined && y2 !== undefined;

  if (is2D) {
    // 2D rendering
    const lineWidth = Math.max(1, Math.abs(weight) * 3);
    const strokeColor = weight > 0 ? 'rgba(0, 0, 255, 0.5)' : 'rgba(255, 0, 0, 0.5)';
    
    return (
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={strokeColor}
        strokeWidth={lineWidth}
        onMouseOver={() => setHovered(true)}
        onMouseOut={() => setHovered(false)}
      >
        {hovered && (
          <title>Weight: {weight.toFixed(2)}</title>
        )}
      </line>
    );
  }

  // 3D rendering (original)
  // Midpoint calculation for placing the tooltip
  const midPoint = sourcePosition && targetPosition ? [
    (sourcePosition[0] + targetPosition[0]) / 2,
    (sourcePosition[1] + targetPosition[1]) / 2,
    (sourcePosition[2] + targetPosition[2]) / 2,
  ] as [number, number, number] : [0, 0, 0];

  return (
    <>
      <Line
        points={sourcePosition && targetPosition ? [sourcePosition, targetPosition] : []}
        color={weight > 0 ? 'blue' : 'red'}
        lineWidth={Math.max(0.4, Math.abs(weight)) * 2}
        onPointerOver={() => setHovered(true)} // Show tooltip on hover
        onPointerOut={() => setHovered(false)} // Hide tooltip on hover end
      />
      {hovered && (
        <Html
          position={midPoint } // Place tooltip at the midpoint of the line
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
          }}
        >
          Weight: {weight.toFixed(2)} {/* Display the weight value */}
        </Html>
      )}
    </>
  );
};

export default Edge;
