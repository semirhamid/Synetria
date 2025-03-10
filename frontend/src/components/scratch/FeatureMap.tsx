import React from 'react';
import { FeatureMapData } from '../types';

interface FeatureMapProps {
  featureMap: FeatureMapData;
  scale?: number;
  colorMap?: 'grayscale' | 'heatmap';
}

const FeatureMap: React.FC<FeatureMapProps> = ({ 
  featureMap, 
  scale = 4,
  colorMap = 'grayscale' 
}) => {
  const { activation_map } = featureMap;
  
  // Normalize activation values for visualization (between 0 and 1)
  const normalizeActivation = (activations: number[][]) => {
    const flatActivations = activations.flat();
    const min = Math.min(...flatActivations);
    const max = Math.max(...flatActivations);
    const range = max - min;
    
    return activations.map(row =>
      row.map(value => range === 0 ? 0.5 : (value - min) / range)
    );
  };
  
  // Get color based on normalized value and selected color map
  const getColor = (value: number) => {
    if (colorMap === 'grayscale') {
      const intensity = Math.floor(value * 255);
      return `rgb(${intensity}, ${intensity}, ${intensity})`;
    } else {
      // Heatmap: blue (cold) to red (hot)
      const r = Math.floor(value * 255);
      const g = Math.floor(Math.sin(value * Math.PI) * 255);
      const b = Math.floor((1 - value) * 255);
      return `rgb(${r}, ${g}, ${b})`;
    }
  };
  
  const normalizedActivations = normalizeActivation(activation_map);
  
  return (
    <div className="feature-map">
      <div className="feature-map-title">
        Channel {featureMap.channel_id}
      </div>
      <div 
        className="feature-map-grid" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${activation_map[0].length}, ${scale}px)`,
          gap: '1px'
        }}
      >
        {normalizedActivations.map((row, rowIdx) =>
          row.map((value, colIdx) => (
            <div
              key={`${rowIdx}-${colIdx}`}
              style={{
                width: `${scale}px`,
                height: `${scale}px`,
                backgroundColor: getColor(value),
              }}
              title={`Value: ${activation_map[rowIdx][colIdx].toFixed(4)}`}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default FeatureMap; 