import React, { useMemo, useRef, useEffect, useState } from 'react';
import { LayerData } from '../../types';
import { Html, Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';
import Edge from './Edge';

interface DenseLayerVisualizerProps {
  layer: LayerData;
  layerIndex: number;
  nextLayer: LayerData | null;
  layerSpacing: number;
  neuronSpacing: number;
  nodeSize: number;
  colors: string[];
}

/**
 * Calculates positions for neurons in a layer - memoized for performance
 */
const DenseLayerVisualizer: React.FC<DenseLayerVisualizerProps> = ({
  layer,
  layerIndex,
  nextLayer,
  layerSpacing,
  neuronSpacing,
  nodeSize,
  colors,
}) => {
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  // console.log(layer)

  const neuronPositions = useMemo(() => {
    // For a dense layer, the number of neurons is equal to the number of biases
    const numNeurons = layer.biases ? layer.biases.length : 0;

    // Calculate vertical offset to center the layer
    const totalHeight = (numNeurons - 1) * neuronSpacing;
    const startY = -totalHeight / 2;

    return Array.from({ length: numNeurons }, (_, neuronIndex) => {
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
          layerIndex * layerSpacing, // X position (layer depth)
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
  }, [layer, layerIndex, layerSpacing, neuronSpacing]);

  // Memoize the next layer positions for connections (if needed)
  const nextLayerPositions = useMemo(() => {
    if (!nextLayer) return [];

    const numNeurons = nextLayer.biases ? nextLayer.biases.length : 0;
    const totalHeight = (numNeurons - 1) * neuronSpacing;
    const startY = -totalHeight / 2;

    return Array.from({ length: numNeurons }, (_, neuronIndex) => (
        [
          (layerIndex + 1) * layerSpacing,
          startY + neuronIndex * neuronSpacing,
          0,
        ] as [number, number, number])
    );
  }, [nextLayer, layerIndex, layerSpacing, neuronSpacing]);

  // Update node color/size based on bias values
  useEffect(() => {
    if (!nodesRef.current) return;

    // Loop through each neuron and update its matrix and color
    neuronPositions.forEach((neuron, idx) => {
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
  }, [layer.activations, neuronPositions, nodeSize, colors, layerIndex]);

  // for optimization: only render edges when needed
  // (e.g., when hovering over a node or after training is complete)
  const shouldRenderEdges =
    hoveredNode !== null ||
    neuronPositions.length * nextLayerPositions.length < 800;

  return (
    <group>
      {/* Render neurons using instanced mesh for performance */}
      <Instances limit={neuronPositions.length} ref={nodesRef}>
        {/* <sphereGeometry args={[0.3, 8, 8]} /> */}
        <boxGeometry args={[0.5, 0.5, 0.5, 2, 2]} />
        <meshBasicMaterial transparent={true} />

        {neuronPositions.map((neuron, idx) => (
          <Instance
            key={`neuron-${layerIndex}-${idx}`}
            position={neuron.position}
            scale={nodeSize}
            onPointerOver={() => setHoveredNode(idx)}
            onPointerOut={() => setHoveredNode(null)}
            color={neuron.color}
          >
            {/* <meshBasicMaterial color={neuron.color} transparent={true} opacity={neuron.opacity} /> */}
          </Instance>
        ))}
      </Instances>

      {/* Display activation and bias value for hovered neuron */}
      {hoveredNode !== null && (
        <Html
          position={[
            neuronPositions[hoveredNode].position[0],
            neuronPositions[hoveredNode].position[1],
            neuronPositions[hoveredNode].position[2], 
          ]}
        >
          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '5px',
              fontSize: '14px',
              whiteSpace: 'nowrap',
            }}
          >
            <div>
              Activation: {neuronPositions[hoveredNode].activation?.toFixed(4) || 'N/A'} 
            </div>
            <div>Bias: {neuronPositions[hoveredNode].bias?.toFixed(4) || 'N/A'}</div>
          </div>
        </Html>
      )}

      {/* Render connections on demand for better performance */}
      {shouldRenderEdges && nextLayer && nextLayer.weights && (
        <>
          {nextLayer.weights.map((neuronWeights, targetIndex) =>
            neuronWeights.map((weight, sourceIndex) => {
              if (hoveredNode !== null && sourceIndex !== hoveredNode)
                return null;

              const sourcePosition = neuronPositions[sourceIndex]?.position;
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
    </group>
  );
};

export default DenseLayerVisualizer;
