import { DenseLayerData } from "../layers.types";

const calculateNeuronPositions = (
    layer: DenseLayerData, 
    neuronSpacing: number,
    layerSpacing: number,
    layerIndex: number,

) => {
    const numNeurons = layer.weights.length;

    const totalHeight = (numNeurons - 1) * neuronSpacing;
    const startY = -totalHeight / 2

    return Array.from({ length: numNeurons }, (_, neuronIndex) => {
        return [
            layerIndex * layerSpacing,
            startY + neuronIndex * neuronSpacing,
            0,
        ]
    });
}

export default calculateNeuronPositions;