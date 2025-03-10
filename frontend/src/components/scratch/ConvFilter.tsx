import React from 'react';
import { ConvFilterData } from '../types';

interface ConvFilterProps {
  filter: ConvFilterData;
  scale?: number;
}

const ConvFilter: React.FC<ConvFilterProps> = ({ filter, scale = 20 }) => {
  const { filter_weights } = filter;
  
  // Normalize filter values for visualization (between 0 and 1)
  const normalizeFilter = (weights: number[][]) => {
    const flatWeights = weights.flat();
    const min = Math.min(...flatWeights);
    const max = Math.max(...flatWeights);
    const range = max - min;
    
    return weights.map(row =>
      row.map(value => range === 0 ? 0.5 : (value - min) / range)
    );
  };
  
  const normalizedWeights = normalizeFilter(filter_weights);
  
  return (
    <div className="conv-filter">
      <div className="filter-title">
        Filter {filter.filter_id}, Channel {filter.channel}
      </div>
      <div className="filter-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${filter_weights[0].length}, ${scale}px)` }}>
        {normalizedWeights.map((row, rowIdx) =>
          row.map((value, colIdx) => (
            <div
              key={`${rowIdx}-${colIdx}`}
              style={{
                width: `${scale}px`,
                height: `${scale}px`,
                backgroundColor: `rgba(${Math.floor(value * 255)}, ${Math.floor(value * 255)}, ${Math.floor(value * 255)}, 1)`,
                border: '1px solid #ddd',
              }}
              title={`Value: ${filter_weights[rowIdx][colIdx].toFixed(4)}`}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ConvFilter; 