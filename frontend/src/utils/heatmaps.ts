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

/**
 * Jet colormap
 * Based on MATLAB's jet colormap formula.
 * @param value Normalized value (0-1)
 * @returns RGB color values (0-255)
 */
export const jetColormap = (value: number): [number, number, number] => {
  const r = Math.max(0, Math.min(1, 1.5 - Math.abs(4 * value - 3)));
  const g = Math.max(0, Math.min(1, 1.5 - Math.abs(4 * value - 2)));
  const b = Math.max(0, Math.min(1, 1.5 - Math.abs(4 * value - 1)));
  return [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)];
};

/**
 * Plasma colormap using linear interpolation between predefined colors.
 * Approximate mapping based on known plasma values.
 * @param value Normalized value (0-1)
 * @returns RGB color values (0-255)
 */
export const plasmaColormap = (value: number): [number, number, number] => {
  const points: Array<{ pos: number; color: [number, number, number] }> = [
    { pos: 0.0, color: [13, 8, 135] },
    { pos: 0.25, color: [126, 3, 167] },
    { pos: 0.5, color: [203, 71, 119] },
    { pos: 0.75, color: [244, 149, 0] },
    { pos: 1.0, color: [240, 249, 33] },
  ];
  for (let i = 0; i < points.length - 1; i++) {
    if (value >= points[i].pos && value <= points[i + 1].pos) {
      const t = (value - points[i].pos) / (points[i + 1].pos - points[i].pos);
      const r = Math.round(points[i].color[0] + t * (points[i + 1].color[0] - points[i].color[0]));
      const g = Math.round(points[i].color[1] + t * (points[i + 1].color[1] - points[i].color[1]));
      const b = Math.round(points[i].color[2] + t * (points[i + 1].color[2] - points[i].color[2]));
      return [r, g, b];
    }
  }
  // Fallback to the last color if value is 1
  return points[points.length - 1].color;
};