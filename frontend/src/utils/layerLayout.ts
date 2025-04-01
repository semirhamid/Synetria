import * as THREE from 'three';

interface FeatureMapLayout {
  featureMapCount: number;
  featureMapSize: number;
  featureMapSpacing: number;
  featureMapsPerRow: number;
  layerPosition: [number, number, number];
}

interface NeuronLayout {
  neuronSize: number;
  neuronSpacing: number;
  neuronCount: number;
  neuronPositions: [number, number, number][];
  neuronColors: THREE.Color[];
  layerPosition: [number, number, number];
}

const createFeatureMapLayout = (
  layerIndex: number,
  layerSpacing: number,
  featureMaps: number
): FeatureMapLayout => {
  // TODO: Move these to a const file
  const featureMapSize = 5; // Size of each feature map visualization
  const featureMapSpacing = 0.8; // Space between feature maps

  const layerPosition: [number, number, number] = [
    0,
    0,
    -layerIndex * layerSpacing,
  ];
  const featureMapsPerRow = Math.ceil(Math.sqrt(featureMaps)); // Arrange feature maps in a grid

  return {
    featureMapCount: featureMaps,
    featureMapSize: featureMapSize,
    featureMapSpacing: featureMapSpacing,
    featureMapsPerRow: featureMapsPerRow,
    layerPosition: layerPosition,
  };
};

const createNeuronLayout = (
  activations: number[],
  neuronSpacing: number,
  layerIndex: number,
  layerSpacing: number
): NeuronLayout => {
  const numNeurons = activations.length;
  const layerPosition: [number, number, number] = [
    0,
    0,
    -layerIndex * layerSpacing,
  ];

  const totalHeight = (numNeurons - 1) * neuronSpacing;
  const startY = -totalHeight / 2;

  // TODO: Move to a constants file
  const neuronSize = 5;

  // Normalizing factors for the activations to get their intensity
  let min = Infinity;
  let max = -Infinity;

  activations.forEach((activation) => {
    min = Math.min(min, activation);
    max = Math.max(max, activation);
  });
  const range = max - min || 1;

  const layout: NeuronLayout = {
    neuronCount: numNeurons,
    neuronColors: [],
    neuronPositions: [],
    neuronSize: neuronSize,
    neuronSpacing: neuronSpacing,
    layerPosition: layerPosition,
  };

  activations.forEach((activation, neuronIndex) => {
    // const activation = activations[neuronIndex];
    const intensity = Math.max(0.2, Math.min(1.0, (activation - min) / range));

    const color: THREE.Color =
      activation > 0
        ? new THREE.Color(0, 0, intensity)
        : new THREE.Color(intensity, 0, 0);
    const neuronPosition: [number, number, number] = [
      0,
      startY + neuronIndex * neuronSpacing,
      0,
    ];

    layout.neuronPositions.push(neuronPosition);
    // layout.neuronActivations.push(activation);
    layout.neuronColors.push(color);
  });
  return layout;
};

export type { FeatureMapLayout, NeuronLayout };
export { createFeatureMapLayout, createNeuronLayout };
