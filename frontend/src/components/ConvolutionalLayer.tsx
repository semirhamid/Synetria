import React, { useState } from 'react';
import { ConvLayerData } from './types';
import ConvFilter from './ConvFilter';
import FeatureMap from './FeatureMap';

interface ConvolutionalLayerProps {
  layer: ConvLayerData;
}

const ConvolutionalLayer: React.FC<ConvolutionalLayerProps> = ({ layer }) => {
  const [activeTab, setActiveTab] = useState<'filters' | 'featureMaps'>('filters');
  const [selectedFilter, setSelectedFilter] = useState<number | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null);
  const [colorMap, setColorMap] = useState<'grayscale' | 'heatmap'>('grayscale');
  
  // Group filters by filter_id for easier navigation
  const groupedFilters: { [key: number]: typeof layer.filters } = {};
  layer.filters.forEach(filter => {
    if (!groupedFilters[filter.filter_id]) {
      groupedFilters[filter.filter_id] = [];
    }
    groupedFilters[filter.filter_id].push(filter);
  });
  
  return (
    <div className="convolutional-layer p-4 border rounded-lg shadow-md bg-white">
      <h3 className="text-xl font-bold mb-4">{layer.layer_name}</h3>
      
      <div className="layer-info mb-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm">Kernel Size: {layer.kernel_size.join(' × ')}</div>
          <div className="text-sm">Stride: {layer.stride.join(' × ')}</div>
          <div className="text-sm">Padding: {layer.padding.join(' × ')}</div>
        </div>
        <div>
          <div className="text-sm">Input Shape: {layer.input_shape.join(' × ')}</div>
          <div className="text-sm">Output Shape: {layer.output_shape.join(' × ')}</div>
        </div>
      </div>
      
      <div className="tabs flex mb-4">
        <button 
          className={`py-2 px-4 ${activeTab === 'filters' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('filters')}
        >
          Filters ({Object.keys(groupedFilters).length})
        </button>
        <button 
          className={`py-2 px-4 ${activeTab === 'featureMaps' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('featureMaps')}
        >
          Feature Maps ({layer.feature_maps.length})
        </button>
      </div>
      
      {activeTab === 'filters' && (
        <div>
          <div className="filter-navigation flex mb-4">
            <div className="mr-4">
              <label className="text-sm block mb-1">Filter:</label>
              <select 
                className="border p-1" 
                onChange={(e) => setSelectedFilter(Number(e.target.value))}
                value={selectedFilter ?? ''}
              >
                <option value="">All Filters</option>
                {Object.keys(groupedFilters).map(filterId => (
                  <option key={filterId} value={filterId}>
                    Filter {filterId}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm block mb-1">Input Channel:</label>
              <select 
                className="border p-1" 
                onChange={(e) => setSelectedChannel(e.target.value ? Number(e.target.value) : null)}
                value={selectedChannel ?? ''}
              >
                <option value="">All Channels</option>
                {Array.from({ length: layer.input_shape[0] }).map((_, idx) => (
                  <option key={idx} value={idx}>
                    Channel {idx}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="filters-grid grid grid-cols-3 gap-4">
            {layer.filters
              .filter(filter => 
                (selectedFilter === null || filter.filter_id === selectedFilter) &&
                (selectedChannel === null || filter.channel === selectedChannel)
              )
              .map((filter, idx) => (
                <ConvFilter 
                  key={`${filter.filter_id}-${filter.channel}`} 
                  filter={filter} 
                />
              ))
            }
          </div>
        </div>
      )}
      
      {activeTab === 'featureMaps' && (
        <div>
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
      )}
    </div>
  );
};

export default ConvolutionalLayer; 