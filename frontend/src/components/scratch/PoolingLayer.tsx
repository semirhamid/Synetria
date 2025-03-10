import React, { useState } from 'react';
import { PoolingLayerData } from '../types';
import FeatureMap from './FeatureMap';

interface PoolingLayerProps {
  layer: PoolingLayerData;
}

const PoolingLayer: React.FC<PoolingLayerProps> = ({ layer }) => {
  const [colorMap, setColorMap] = useState<'grayscale' | 'heatmap'>('grayscale');
  
  return (
    <div className="pooling-layer p-4 border rounded-lg shadow-md bg-white">
      <h3 className="text-xl font-bold mb-4">
        {layer.layer_name} ({layer.pool_type.toUpperCase()} Pooling)
      </h3>
      
      <div className="layer-info mb-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm">Kernel Size: {layer.kernel_size.join(' × ')}</div>
          <div className="text-sm">Stride: {layer.stride.join(' × ')}</div>
        </div>
        <div>
          <div className="text-sm">Input Shape: {layer.input_shape.join(' × ')}</div>
          <div className="text-sm">Output Shape: {layer.output_shape.join(' × ')}</div>
        </div>
      </div>
      
      <div className="feature-map-controls flex mb-4">
        <div>
          <label className="text-sm block mb-1">Color Map:</label>
          <select 
            className="border p-1" 
            onChange={(e) => setColorMap(e.target.value as 'grayscale' | 'heatmap')}
            value={colorMap}
          >
            <option value="grayscale">Grayscale</option>
            <option value="heatmap">Heatmap</option>
          </select>
        </div>
      </div>
      
      <div className="feature-maps-grid grid grid-cols-3 gap-4">
        {layer.feature_maps.map(featureMap => (
          <FeatureMap 
            key={featureMap.channel_id} 
            featureMap={featureMap} 
            colorMap={colorMap}
          />
        ))}
      </div>
    </div>
  );
};

export default PoolingLayer; 