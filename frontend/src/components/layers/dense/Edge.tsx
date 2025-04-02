import React, { useState } from 'react';
import { Line } from '@react-three/drei';
import LayerInfoTooltip from '../common/tooltip/Tooltip';

interface EdgeProps {
  sourcePosition: [number, number, number];
  targetPosition: [number, number, number];
  weight: number;
}

const Edge: React.FC<EdgeProps> = ({
  sourcePosition,
  targetPosition,
  weight,
}) => {
  const [hovered, setHovered] = useState(false);

  if (!sourcePosition || !targetPosition) {
    console.warn('Edge: sourcePosition or targetPosition is undefined', { sourcePosition, targetPosition });
    return null;
  }

  // Determine opacity based on weight magnitude
  // Use a minimum opacity so very weak weights are still visible but faint
  const absWeight = Math.abs(weight);
  const opacity = Math.max(0.5, Math.min(1.0, absWeight));
  
  // Determine line width based on weight (but keeping it reasonable)
  const lineWidth = Math.max(0.3, Math.min(3.0, absWeight * 3));

  // Midpoint calculation for placing the tooltip
  const midPoint = [
    (sourcePosition[0] + targetPosition[0]) / 2,
    (sourcePosition[1] + targetPosition[1]) / 2,
    (sourcePosition[2] + targetPosition[2]) / 2,
  ] as [number, number, number];

  return (
    <>
      <Line
        points={[sourcePosition, targetPosition]}
        color={weight > 0 ? 'blue' : 'red'} // Keep red for negative, blue for positive
        lineWidth={lineWidth}
        transparent={true}
        opacity={opacity}
        onPointerOver={() => setHovered(true)} // Show tooltip on hover
        onPointerOut={() => setHovered(false)} // Hide tooltip on hover end
      />
      {hovered && (
        <LayerInfoTooltip
          position={midPoint}
          fontSize={0.15}
          maxWidth={2}
        >
          <div>Weight: {weight.toFixed(2)}</div>
        </LayerInfoTooltip>
      )}
    </>
  );
};

export default Edge;