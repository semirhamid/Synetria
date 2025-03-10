import { MLPLayerData } from "../components/types";

export const calculateNeuronPositions = (
  layerSizes: number[], // Sizes of each layer in the network
  width: number,        // Width of the container
  height: number,       // Height of the container
  layerSpacing: number, // Horizontal spacing between layers
  neuronSpacing: number // Vertical spacing between neurons in a layer
): { layerPositions: number[], neuronPositions: number[][] } => {
  const layerPositions: number[] = [];
  const neuronPositions: number[][] = [];
  
  // Calculate horizontal position for each layer
  const horizontalMargin = 100;
  const usableWidth = width - horizontalMargin * 2;
  const layerStep = layerSizes.length > 1 ? usableWidth / (layerSizes.length - 1) : usableWidth;
  
  for (let i = 0; i < layerSizes.length; i++) {
    // Calculate y position (vertical center) for the layer
    const yPos = height / 2;
    layerPositions.push(yPos);
    
    // Calculate positions for each neuron in the layer
    const layerSize = layerSizes[i];
    const neurons: number[] = [];
    
    // Calculate vertical positions for neurons in this layer
    const totalNeuronHeight = (layerSize - 1) * neuronSpacing;
    const verticalStart = yPos - totalNeuronHeight / 2;
    
    for (let j = 0; j < layerSize; j++) {
      const xPos = horizontalMargin + i * layerStep;
      neurons.push(xPos);
    }
    
    neuronPositions.push(neurons);
  }
  
  return { layerPositions, neuronPositions };
};

// Legacy calculation method for backward compatibility
export const calculateNeuronPositionsLegacy = (
  mlpData: MLPLayerData[],
  layerSpacing: number,
  neuronSpacing: number
): [number, number, number][][] => {
  return mlpData.map((layer, layerIndex) =>
    layer.weights.map((_, neuronIndex) => [
      layerIndex * layerSpacing,
      neuronIndex * neuronSpacing,
      0,
    ])
  );
};
