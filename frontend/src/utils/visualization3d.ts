import * as THREE from 'three';
import { jetColormap } from './heatmaps';

/**
 * Creates a texture from a 2D array of values
 * @param data 2D array of values
 * @param colorMap Function to map normalized values to RGB colors
 * @returns THREE.Texture
 */
export const createTextureFromGrayscaleImg = (
  data: number[][],
  colorMap: (value: number) => [number, number, number] = jetColormap
): THREE.Texture => {
  const height = data.length;
  const width = data[0]?.length || 0;

  if (height === 0 || width === 0) {
    return new THREE.Texture();
  }

  // Create a regular 2d canvas to draw the data
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.Texture();

  const imageData = ctx.createImageData(width, height);

  // Normalization
  let min = Infinity;
  let max = -Infinity;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = data[y][x];
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }

  const range = max - min || 1; // Avoid division by zero

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;

      // Normalize value to 0-1 range
      const normalizedValue = (data[y][x] - min) / range;

      const [r, g, b] = colorMap(normalizedValue);

      imageData.data[i] = r;
      imageData.data[i + 1] = g;
      imageData.data[i + 2] = b;
      imageData.data[i + 3] = 255; // Alpha
    }
  }

  // Write to canvas, crate the texture
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

export const createTextureFromImg = (
  data: number[][][]
): THREE.Texture => {
  const height = data.length;
  const width = data[0]?.length || 0;
  const channels = data[0]?.[0]?.length || 1;

  // console.table({ channels, width, height });

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');

  if (!ctx || height === 0 || width === 0) return new THREE.Texture();

  const imageData = ctx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;

      if (channels === 1) {
        const value = Math.floor(data[y][x][0] * 255);
        imageData.data[i] = value;
        imageData.data[i + 1] = value;
        imageData.data[i + 2] = value;
        imageData.data[i + 3] = value;
      } else if (channels === 3) {
        imageData.data[i] = Math.floor(data[y][x][0] * 255);
        imageData.data[i + 1] = Math.floor(data[y][x][1] * 255);
        imageData.data[i + 2] = Math.floor(data[y][x][2] * 255);
        imageData.data[i + 3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

