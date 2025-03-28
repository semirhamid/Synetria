import { useState, useEffect, useCallback } from 'react';
import {
  LayerData,
  ModelMetaData,
  ModelStructure,
  NetworkInput,
  TrainingData,
} from '../components/types';

interface UseNeuralNetworkDataResult {
  networkInputData: NetworkInput | null;
  networkData: LayerData[] | null;
  modelMetadata: ModelStructure | null;
  metaData: ModelMetaData | null;
  currentEpoch: number;
}

const useNeuralNetworkData = (): UseNeuralNetworkDataResult => {
  const [networkInputData, setNetworkInputData] = useState<NetworkInput | null>(null);
  const [networkData, setNetworkData] = useState<LayerData[] | null>(null);
  const [modelMetadata, setModelMetadata] = useState<ModelStructure | null>(null);
  const [metaData, setMetaData] = useState<ModelMetaData | null>(null);
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);

  
  const processWebSocketData = useCallback((receivedData: TrainingData) => {
    if (receivedData.epoch && receivedData.layers) {
      setNetworkData(receivedData.layers);
      setModelMetadata(receivedData.model_structure);
      setCurrentEpoch(receivedData.epoch);
      
      if (
        receivedData.network_input !== null &&
        receivedData.network_input.type == 'image'
      ) {
        setNetworkInputData(receivedData.network_input)
      }

      const metaData: ModelMetaData = {
        epoch: receivedData.epoch,
        batch: receivedData.batch,
        batch_size: receivedData.batch_size,
        learning_rate: receivedData.learning_rate,
        loss: receivedData.loss,
      };
      setMetaData(metaData);
    }
  }, []);

  useEffect(() => {
    // const socket = new WebSocket('ws://localhost:8000');
    const eventSource = new EventSource('http://localhost:8000/stream');

    eventSource.onopen = () => console.log('WebSocket connection established');
    eventSource.onmessage = (event) => {
      try {
        const receivedData: TrainingData = JSON.parse(event.data);
        // console.log(`incoming data: `, receivedData)
        processWebSocketData(receivedData);
      } catch (error) {
        console.error('Error processing WebSocket data:', error);
      }
    };
    eventSource.onerror = (error) => console.error('WebSocket error:', error);

    return () => {
      eventSource.close();
    };
  }, [processWebSocketData]);

  return { networkInputData, networkData, modelMetadata, metaData, currentEpoch };
};

export default useNeuralNetworkData;