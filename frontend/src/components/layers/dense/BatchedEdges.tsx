import { useMemo } from 'react';
import { LineSegments, BufferGeometry, Float32BufferAttribute, LineBasicMaterial } from 'three';

interface BatchedEdgesProps {
  positions: number[]; 
  color: string; // e.g., "blue" or "red"
}

const BatchedEdges: React.FC<BatchedEdgesProps> = ({ positions, color }) => {
  const geometry = useMemo(() => {
    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    return geom;
  }, [positions]);

  const material = useMemo(() => {
    return new LineBasicMaterial({ color, opacity: 0.4, transparent: true });
  }, [color]);

  return <primitive object={new LineSegments(geometry, material)} />;
};

export default BatchedEdges;