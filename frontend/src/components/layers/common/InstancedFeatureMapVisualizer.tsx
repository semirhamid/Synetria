import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { FeatureMap } from '../layers.types';
import LayerInfoTooltip from '../Tooltip';

import vertexShader from './shaders/featureMap/vertex.glsl';
import fragmentShader from './shaders/featureMap/fragment.glsl';

interface InstancedFeatureMapMeshProps {
  featureMaps: FeatureMap[];
  mapPositions: [number, number, number][];
  size: number;
  colormap: (value: number) => [number, number, number];
  onHover?: (isHovered: boolean, index: number) => void;
}

const InstancedFeatureMapMesh = React.memo(
  ({
    featureMaps,
    mapPositions,
    size,
    colormap,
  }: InstancedFeatureMapMeshProps) => {
    const meshRef = useRef<THREE.InstancedMesh | null>(null);
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);
    const textureAtlasRef = useRef<THREE.DataArrayTexture | null>(null);
    const instanceTransformationMatrix = useMemo(() => new THREE.Matrix4(), []);
    const [hoveredMapIndex, setHoveredMapIndex] = useState<number | null>(null);

    const textureWidth = featureMaps[0].shape[0];
    const textureHeight = featureMaps[0].shape[1];
    const mapSize = textureWidth * textureHeight;

    // Texture atlas of all the feature map activations
    useEffect(() => {
      const textureWidth = featureMaps[0].shape[0];
      const textureHeight = featureMaps[0].shape[1];

      const size = textureWidth * textureHeight * 4 * featureMaps.length; // texture size * num of textures
      const data = new Uint8Array(size);

      featureMaps.forEach((featureMap, index) => {
        const activationMap = featureMap.activation_map;
        if (!activationMap || activationMap.length === 0) {
          console.warn(`Missing texture: Filter activation map not found`);
          return;
        }

        // Normalizing factors for the activation map values
        let min = Infinity;
        let max = -Infinity;

        for (let y = 0; y < textureHeight; y++) {
          for (let x = 0; x < textureWidth; x++) {
            const val = activationMap[y][x];
            min = Math.min(min, val);
            max = Math.max(max, val);
          }
        }
        const range = max - min || 1;

        const baseOffset = index * textureHeight * textureWidth * 4; // Start of the textures for this feature map
        for (let i = 0; i < activationMap.length; i++) {
          for (let j = 0; j < activationMap[i].length; j++) {
            const value = activationMap[i][j];
            const normalizedValue = (value - min) / range;

            const [r, g, b] = colormap(normalizedValue); // returns the r,g,b values for that pixel

            const offset = baseOffset + (i * textureWidth + j) * 4;
            data[offset] = r;
            data[offset + 1] = g;
            data[offset + 2] = b;
            data[offset + 3] = 255;
          }
        }
      });

      const newTextureAtlas = new THREE.DataArrayTexture(
        data,
        textureWidth,
        textureHeight,
        featureMaps.length
      );
      newTextureAtlas.needsUpdate = true;
      newTextureAtlas.format = THREE.RGBAFormat;
      newTextureAtlas.minFilter = THREE.LinearFilter;
      newTextureAtlas.magFilter = THREE.LinearFilter;
      newTextureAtlas.colorSpace = THREE.SRGBColorSpace;

      // Replace the old texture
      const oldTextureAtlas = textureAtlasRef.current;

      textureAtlasRef.current = newTextureAtlas;
      if (materialRef.current) {
        materialRef.current.uniforms.textureAtlas.value = newTextureAtlas;
        materialRef.current.needsUpdate = true;
      }

      if (oldTextureAtlas) oldTextureAtlas.dispose();
    }, [featureMaps, colormap]);

    // Set the positions of the feature map instances.
    useEffect(() => {
      if (!meshRef.current || !mapPositions.length) return;

      // Ensure instance count matches position data length, just in case.
      const instanceCount = Math.min(
        meshRef.current.count,
        mapPositions.length
      );
      for (let i = 0; i < instanceCount; i++) {
        const position = mapPositions[i];
        if (position) {
          instanceTransformationMatrix.setPosition(
            position[0],
            position[1],
            position[2]
          );
          meshRef.current?.setMatrixAt(i, instanceTransformationMatrix);
        }
      }

      meshRef.current.instanceMatrix.needsUpdate = true;
    }, [mapPositions, instanceTransformationMatrix]);

    const [instanceGeometry, instanceMaterial] = useMemo(() => {
      const geometry = new THREE.PlaneGeometry(size, size, 1, 1);
      const material = new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
          textureAtlas: new THREE.Uniform(textureAtlasRef.current),
          mapCount: new THREE.Uniform(featureMaps.length),
          mapSize: new THREE.Uniform(mapSize),
        },
      });
      materialRef.current = material;
      return [geometry, material];
    }, [size, mapSize, featureMaps.length]);

    useEffect(() => {
      return () => {
        instanceGeometry?.dispose();
        instanceMaterial?.dispose();
        textureAtlasRef?.current?.dispose();
      };
    }, [instanceGeometry, instanceMaterial]);

    return (
      <group>
        <instancedMesh
          args={[instanceGeometry, instanceMaterial, featureMaps.length]}
          count={featureMaps.length}
          ref={meshRef}
          onPointerOver={(e) => setHoveredMapIndex(e.instanceId ?? null)}
          onPointerOut={() => setHoveredMapIndex(null)}
        />
        {hoveredMapIndex !== null && (
          <LayerInfoTooltip
            position={mapPositions[hoveredMapIndex]}
            fontSize={0.2}
          >
            <div>Channel: {featureMaps[hoveredMapIndex].channel_id}</div>
            <div>
              Size: {featureMaps[hoveredMapIndex].activation_map[0].length}x
              {featureMaps[hoveredMapIndex].activation_map.length}
            </div>
            {/* <div>
              Pool: {pool_type}{' '}
              {kernel_size ? `${kernel_size[0]}x${kernel_size[1]}` : ''}
            </div> */}
          </LayerInfoTooltip>
        )}
      </group>
    );
  }
);

export { InstancedFeatureMapMesh };
