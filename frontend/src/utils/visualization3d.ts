import * as THREE from 'three';

/**
 * Creates a texture from a 2D array of values
 * @param data 2D array of values
 * @param colorMap Function to map normalized values to RGB colors
 * @returns THREE.Texture
 */
export const createTextureFromData = (
  data: number[][],
  colorMap: (value: number) => [number, number, number] = heatmapColormap
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
  return texture;
};

/**
 * Heatmap colormap (blue to red)
 * @param value Normalized value (0-1)
 * @returns RGB color values (0-255)
 */
export const heatmapColormap = (value: number): [number, number, number] => {
  if (value < 0.5) {
    // Blue to white gradient
    const intensity = value * 2 * 255;
    return [intensity, intensity, 255];
  } else {
    // White to red gradient
    const intensity = (value - 0.5) * 2 * 255;
    return [255, 255 - intensity, 255 - intensity];
  }
};

/**
 * Viridis-like colormap (purple to yellow)
 * @param value Normalized value (0-1)
 * @returns RGB color values (0-255)
 */
export const viridisColormap = (value: number): [number, number, number] => {
  if (value < 0.33) {
    // Purple to blue gradient
    const t = value / 0.33;
    return [
      Math.floor(73 + t * (41 - 73)),
      Math.floor(11 + t * (121 - 11)),
      Math.floor(106 + t * (142 - 106)),
    ];
  } else if (value < 0.66) {
    // Blue to green gradient
    const t = (value - 0.33) / 0.33;
    return [
      Math.floor(41 + t * (33 - 41)),
      Math.floor(121 + t * (181 - 121)),
      Math.floor(142 + t * (74 - 142)),
    ];
  } else {
    // Green to yellow gradient
    const t = (value - 0.66) / 0.34;
    return [
      Math.floor(33 + t * (253 - 33)),
      Math.floor(181 + t * (231 - 181)),
      Math.floor(74 + t * (37 - 74)),
    ];
  }
};

/**
 * Greyscale colormap
 * @param value Normalized value (0-1)
 * @returns RGB color values (0-255)
 */
export const greyscaleColormap = (value: number): [number, number, number] => {
  const grey = Math.round(value * 255);
  return [grey, grey, grey];
};
