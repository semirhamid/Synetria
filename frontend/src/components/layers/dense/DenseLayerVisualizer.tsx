import React, { useMemo, useRef, useEffect, useState } from 'react';
import { DenseLayerData, LayerData } from '../layers.types';
import { isDenseLayer } from '../layers.types';
import { Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';
import Edge from './Edge';
import BatchedEdges from './BatchedEdges';
import LayerInfoTooltip from '../Tooltip';

interface DenseLayerVisualizerProps {
  layer: DenseLayerData;
  layerIndex: number;
  nextLayer: LayerData | null;
  layerSpacing: number;
  neuronSpacing: number;
  nodeSize: number;
  colors: string[];
}

interface Layout {
  neuronPositions: {
    position: [number, number, number];
    color: THREE.Color;
    opacity: number;
    activation: number;
    bias: number;
    index: number;
  }[];
  layerPosition: [number, number, number];
}

const DenseLayerVisualizer: React.FC<DenseLayerVisualizerProps> = ({
  layer,
  layerIndex,
  nextLayer,
  layerSpacing,
  neuronSpacing,
  nodeSize,
}) => {
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const { layer_name } = layer;

  // Layout calculations using useMemo for better performance
  const layout = useMemo<Layout>(() => {
    // For a dense layer, the number of neurons is equal to the number of biases
    const numNeurons = layer.biases ? layer.biases.length : 0;

    // Calculate vertical offset to center the layer
    const totalHeight = (numNeurons - 1) * neuronSpacing;
    const startY = -totalHeight / 2;

    const neuronPositions = Array.from({ length: numNeurons }, (_, neuronIndex) => {
      const activation = layer.activations ? layer.activations[neuronIndex] : 0;

      // Determine color based on activation
      const absActivation = Math.abs(activation);
      let color;

      if (absActivation < 0.1) {
        // Very low activation - use black with transparency
        color = new THREE.Color(0x000000);
      } else if (activation < 0) {
        // Negative activation - use red with intensity based on magnitude
        const intensity = Math.max(0.2, Math.min(1.0, absActivation));
        color = new THREE.Color(intensity, 0, 0); // Red with varying intensity
      } else {
        // Positive activation - use blue with intensity based on magnitude
        const intensity = Math.max(0.2, Math.min(1.0, absActivation));
        color = new THREE.Color(0, 0, intensity); // Blue with varying intensity
      }

      // Add slight transparency for better visualization
      const opacity = Math.max(0.6, Math.min(1.0, absActivation));

      return {
        position: [
          0, // X position 
          startY + neuronIndex * neuronSpacing, // Y position (vertical position)
          0, // Z position
        ] as [number, number, number],
        color: color,
        opacity: opacity,
        activation: activation,
        bias: layer.biases ? layer.biases[neuronIndex] : 0,
        index: neuronIndex,
      };
    });

    return {
      neuronPositions,
      layerPosition: [0, 0, -layerIndex * layerSpacing] // Back-to-back stacking
    };
  }, [layer, layerIndex, neuronSpacing, layerSpacing]);

  // Update node color/size based on bias values
  useEffect(() => {
    if (!nodesRef.current) return;

    // Loop through each neuron and update its matrix and color
    layout.neuronPositions.forEach((neuron, idx) => {
      if (!nodesRef.current) return;

      // Create transformation matrix
      const matrix = new THREE.Matrix4();
      const position = new THREE.Vector3(...neuron.position);

      // Scale the node based on activation value (normalized) or use default node size
      const activation = neuron.activation || 0;
      const absActivation = Math.abs(activation);
      const scaleFactor = absActivation
        ? Math.max(0.1, Math.min(2.0, absActivation))
        : 1.0;
      const scale = new THREE.Vector3(
        nodeSize * scaleFactor,
        nodeSize * scaleFactor,
        nodeSize * scaleFactor
      );

      matrix.compose(position, new THREE.Quaternion(), scale);
      nodesRef.current.setMatrixAt(idx, matrix);
    });

    // Mark the instance mesh for update
    if (nodesRef.current) {
      nodesRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [layout.neuronPositions, nodeSize]);

  // Memoize the next layer positions for connections
  const nextLayerPositions = useMemo(() => {
    if (!nextLayer || !isDenseLayer(nextLayer)) return [];

    const numNeurons = nextLayer.biases ? nextLayer.biases.length : 0;
    const totalHeight = (numNeurons - 1) * neuronSpacing;
    const startY = -totalHeight / 2;

    return Array.from(
      { length: numNeurons },
      (_, neuronIndex) =>
        [
          0, // X centered for back-to-back stacking
          startY + neuronIndex * neuronSpacing,
          -layerSpacing // Z position for the next layer
        ] as [number, number, number]
    );
  }, [nextLayer, neuronSpacing, layerSpacing]);

  // Generate edge positions for efficient rendering
  const positiveEdges = useMemo(() => {
    if (!nextLayer || !isDenseLayer(nextLayer)) {
      return;
    }
    const positions: number[] = [];
    nextLayer.weights.forEach((neuronWeights, targetIndex) => {
      neuronWeights.forEach((weight, sourceIndex) => {
        if (weight > 0) {
          const sourcePosition = layout.neuronPositions[sourceIndex]?.position;
          const targetPosition = nextLayerPositions[targetIndex];

          if (sourcePosition && targetPosition) {
            positions.push(...sourcePosition, ...targetPosition);
          }
        }
      });
    });

    return positions;
  }, [nextLayer, layout.neuronPositions, nextLayerPositions]);

  const negativeEdges = useMemo(() => {
    if (!nextLayer || !isDenseLayer(nextLayer)) {
      return;
    }
    const positions: number[] = [];
    nextLayer.weights.forEach((neuronWeights, targetIndex) => {
      neuronWeights.forEach((weight, sourceIndex) => {
        if (weight < 0) {
          const sourcePosition = layout.neuronPositions[sourceIndex]?.position;
          const targetPosition = nextLayerPositions[targetIndex];

          if (sourcePosition && targetPosition) {
            positions.push(...sourcePosition, ...targetPosition);
          }
        }
      });
    });

    return positions;
  }, [nextLayer, layout.neuronPositions, nextLayerPositions]);

  const shouldRenderEdges =
    nextLayer &&
    isDenseLayer(nextLayer) &&
    (hoveredNode !== null ||
      layout.neuronPositions.length * nextLayerPositions.length < 2000);

  return (
    <group position={layout.layerPosition}>
      {/* Layer label */}
      <LayerInfoTooltip position={[-8, 0, 0]}>
        <div style={{ fontWeight: 'bold' }}>{layer_name}</div>
        <div>neurons: {layout.neuronPositions.length}</div>
        {nextLayer && isDenseLayer(nextLayer) && (
          <div>connections: {layout.neuronPositions.length * nextLayerPositions.length}</div>
        )}
      </LayerInfoTooltip>

      {/* Render neurons using instanced mesh for performance */}
      <Instances limit={layout.neuronPositions.length} ref={nodesRef}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshBasicMaterial transparent={true} />

        {layout.neuronPositions.map((neuron, idx) => (
          <Instance
            key={`neuron-${layerIndex}-${idx}`}
            position={neuron.position}
            scale={nodeSize}
            onPointerOver={() => setHoveredNode(idx)}
            onPointerOut={() => setHoveredNode(null)}
            color={neuron.color}
          />
        ))}
      </Instances>

      {/* Display activation and bias value for hovered neuron */}
      {hoveredNode !== null && (
        <LayerInfoTooltip
          position={[
            layout.neuronPositions[hoveredNode].position[0],
            layout.neuronPositions[hoveredNode].position[1],
            layout.neuronPositions[hoveredNode].position[2] + 0.5,
          ]}
          fontSize={0.15}
        >
          <div>Activation: {layout.neuronPositions[hoveredNode].activation?.toFixed(4) || 'N/A'}</div>
          <div>Bias: {layout.neuronPositions[hoveredNode].bias?.toFixed(4) || 'N/A'}</div>
        </LayerInfoTooltip>
      )}

      {/* Render connections in batches, with positive and negative edges. And render the true edges on hover */}
      {shouldRenderEdges && (
        <>
          {hoveredNode === null && positiveEdges && negativeEdges ? (
            <>
              <BatchedEdges positions={positiveEdges} color="blue" />
              <BatchedEdges positions={negativeEdges} color="red" />
            </>
          ) : (
            <>
              {nextLayer?.weights.map((neuronWeights, targetIndex) =>
                neuronWeights.map((weight, sourceIndex) => {
                  if (hoveredNode !== null && sourceIndex !== hoveredNode)
                    return null;

                  const sourcePosition = layout.neuronPositions[sourceIndex]?.position;
                  const targetPosition = nextLayerPositions[targetIndex];

                  if (!sourcePosition || !targetPosition) return null;

                  return (
                    <Edge
                      key={`edge-${layerIndex}-${sourceIndex}-${targetIndex}`}
                      sourcePosition={sourcePosition}
                      targetPosition={targetPosition}
                      weight={weight}
                    />
                  );
                })
              )}
            </>
          )}
        </>
      )}
    </group>
  );
};

export default DenseLayerVisualizer;
