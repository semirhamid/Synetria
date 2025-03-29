import { Text, Billboard } from '@react-three/drei';
import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  position: [number, number, number];
  background?: string;
  fontSize?: number;
  maxWidth?: number;
  textColor?: string;
  opacity?: number;
  glowStrength?: number;
}

const LayerInfoTooltip: React.FC<TooltipProps> = ({
  children,
  position,
  background = '#1a1a4f',
  fontSize = 0.2,
  maxWidth = 4,
  textColor = '#ffffff',
  opacity = 0.9,
  glowStrength = 0.2,
}) => {
  // Convert React children to text content for 3D display
  const textContent = React.Children.toArray(children).map((child) => {
    if (React.isValidElement(child) && child.type === 'div') {
      return child.props.children;
    }
    return String(child);
  });

  return (
    <group position={[position[0], position[1], position[2] + 2]}>
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        {/* Outer glow effect */}
        <mesh position={[0, 0, -0.07]}>
          <planeGeometry
            args={[
              maxWidth + glowStrength,
              textContent.length * fontSize * 1.5 + 0.4 + glowStrength,
            ]}
          />
          <meshBasicMaterial color="#4488ff" transparent opacity={0.3} />
        </mesh>

        {/* Tooltip background panel */}
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry
            args={[maxWidth, textContent.length * fontSize * 1.5 + 0.4]}
          />
          <meshBasicMaterial color={background} transparent opacity={opacity} />
        </mesh>

        {/* Subtle border for better visibility */}
        <mesh position={[0, 0, -0.03]}>
          <boxGeometry
            args={[maxWidth, textContent.length * fontSize * 1.5 + 0.4, 0.001]}
          />
          <meshBasicMaterial
            color="#5599ff"
            wireframe={true}
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* Render each text line */}
        {textContent.map((text, index) => (
          <Text
            key={index}
            position={[
              0,
              textContent.length * fontSize * 0.6 - index * fontSize * 1.2,
              0,
            ]}
            fontSize={fontSize}
            color={textColor}
            anchorX="center"
            anchorY="middle"
            maxWidth={maxWidth - 0.4}
            textAlign="center"
            outlineWidth={0.01}
            outlineColor="#000000"
          >
            {text}
          </Text>
        ))}
      </Billboard>
    </group>
  );
};

export default LayerInfoTooltip;
