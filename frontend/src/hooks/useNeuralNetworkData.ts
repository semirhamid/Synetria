import { useState, useEffect, useCallback } from 'react';
import {
  ModelStructure,
  NetworkInput,
  TrainingData,
  TrainingMetadata,
  TrainingParams,
} from '../components/types';
import { LayerData } from '../components/layers/layers.types';
import { mockData } from './mockData';

export interface NeuralNetworkData {
  trainingMetadata: TrainingMetadata | null;
  trainingParams: TrainingParams | null;
  modelStructure: ModelStructure | null;
  networkInput: NetworkInput | null;
  layerData: LayerData[] | null;
}

const useNeuralNetworkData = (): NeuralNetworkData => {
  const [trainingMetadata, setTrainingMetadata] =
    useState<TrainingMetadata | null>(null);
  const [trainingParams, setTrainingParams] = useState<TrainingParams | null>(
    null
  );
  const [modelStructure, setModelStructure] = useState<ModelStructure | null>(
    null
  );
  const [networkInput, setNetworkInput] = useState<NetworkInput | null>(null);
  const [layerData, setLayerData] = useState<LayerData[] | null>(null);

  const processWebSocketData = useCallback((receivedData: TrainingData) => {
    setTrainingMetadata(receivedData.metadata);
    setTrainingParams(receivedData.parameters);
    setModelStructure(receivedData.model_structure);
    setNetworkInput(receivedData.network_input);
    setLayerData(receivedData.layers);
  }, []);

  useEffect(() => {
    // Mock Data for dev. 
    // processWebSocketData(mockData as unknown as TrainingData);
    // return;

    // Using Server Sent Events instead of websockets for (slight) performance gains.
    const eventSource = new EventSource('http://localhost:8000/stream');

    eventSource.onopen = () => console.log('Connection established...');
    eventSource.onmessage = (event) => {
      try {
        const receivedData: TrainingData = JSON.parse(event.data);
        console.log(receivedData);
        processWebSocketData(receivedData);
      } catch (error) {
        console.error('Error processing Server data:', error);
      }
    };
    eventSource.onerror = (error) => console.error('Connection error:', error);

    return () => {
      eventSource.close();
    };
  }, [processWebSocketData]);

  return {
    trainingMetadata,
    trainingParams,
    networkInput,
    layerData,
    modelStructure,
  };
};

export default useNeuralNetworkData;
