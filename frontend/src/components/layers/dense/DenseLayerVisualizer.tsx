import React, { useMemo, useRef, useEffect, useState } from 'react';
import { DenseLayerData, LayerData } from '../layers.types';
import { isDenseLayer } from '../layers.types';
import { Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';
import Edge from './Edge';
import BatchedEdges from './BatchedEdges';
import LayerInfoTooltip from '../Tooltip';
import type { NeuronLayout } from '@/utils/layerLayout';
import { createNeuronLayout } from '@/utils/layerLayout';

interface DenseLayerVisualizerProps {
  layer: DenseLayerData;
  layerIndex: number;
  nextLayer: LayerData | null;
  layerSpacing: number;
  neuronSpacing: number;
  nodeSize: number;
  colors: string[];
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

  const layout = useMemo<NeuronLayout>(
    () =>
      createNeuronLayout(
        layer.activations,
        neuronSpacing,
        layerIndex,
        layerSpacing
      ),
    [layer, layerIndex, neuronSpacing, layerSpacing]
  );

  // Update node color/size based on bias values
  useEffect(() => {
    if (!nodesRef.current) return;

    for (let i = 0; i < layout.neuronCount; i++) {
      const matrix = new THREE.Matrix4();
      const position = new THREE.Vector3(...layout.neuronPositions[i]);

      const activation = layer.activations[i] || 0;
      const absActivation = Math.abs(activation);
      const scaleFactor = Math.max(0.01, Math.min(2.0, absActivation));
      const scale = new THREE.Vector3(
        nodeSize * scaleFactor,
        nodeSize * scaleFactor,
        nodeSize * scaleFactor
      );

      matrix.compose(position, new THREE.Quaternion(), scale);
      nodesRef.current.setMatrixAt(i, matrix);
    }
    // Mark the instance mesh for update
    if (nodesRef.current) {
      nodesRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [layout.neuronPositions, nodeSize, layer.activations, layout.neuronCount]);

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
          -layerSpacing, // Z position for the next layer
        ] as [number, number, number]
    );
  }, [nextLayer, neuronSpacing, layerSpacing]);

  const [positiveEdges, negativeEdges] = useMemo(() => {
    const positiveEdges: number[] = [];
    const negativeEdges: number[] = [];

    if (!nextLayer || !isDenseLayer(nextLayer)) return [];

    nextLayer.weights.forEach((weights, targetIndex) => {
      weights.forEach((weight, sourceIndex) => {
        const sourcePosition = layout.neuronPositions[sourceIndex];
        const targetPosition = nextLayerPositions[targetIndex];
        if (weight > 0) {
          positiveEdges.push(...sourcePosition, ...targetPosition);
        } else {
          negativeEdges.push(...sourcePosition, ...targetPosition);
        }
      });
    });
    return [positiveEdges, negativeEdges];
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
          <div>
            connections:{' '}
            {layout.neuronPositions.length * nextLayerPositions.length}
          </div>
        )}
      </LayerInfoTooltip>

      {/* Render neurons using instanced mesh for performance */}
      <Instances limit={layout.neuronPositions.length} ref={nodesRef}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshBasicMaterial transparent={true} />

        {layout.neuronPositions.map((neuronPosition, idx) => (
          <Instance
            key={`neuron-${layerIndex}-${idx}`}
            position={neuronPosition}
            scale={nodeSize}
            onPointerOver={() => setHoveredNode(idx)}
            onPointerOut={() => setHoveredNode(null)}
            color={layout.neuronColors[idx]}
          />
        ))}
      </Instances>

      {/* Display activation and bias value for hovered neuron */}
      {hoveredNode !== null && (
        <LayerInfoTooltip
          position={[
            layout.neuronPositions[hoveredNode][0],
            layout.neuronPositions[hoveredNode][1],
            layout.neuronPositions[hoveredNode][2] + 0.5,
          ]}
          fontSize={0.15}
        >
          <div>
            Activation: {layer.activations[hoveredNode].toFixed(4) || 'N/A'}
          </div>
          <div>Bias: {layer.biases[hoveredNode].toFixed(4) || 'N/A'}</div>
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

                  const sourcePosition = layout.neuronPositions[sourceIndex];
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
