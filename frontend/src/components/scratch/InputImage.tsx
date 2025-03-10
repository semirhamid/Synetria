import React, { useState, useEffect, useRef } from 'react';

interface InputImageProps {
  imageData: number[][][]; // [channels, height, width]
}

const InputImage: React.FC<InputImageProps> = ({ imageData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showChannels, setShowChannels] = useState<boolean>(false);
  
  useEffect(() => {
    if (!canvasRef.current || !imageData || !imageData.length) {
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const channels = imageData.length;
    const height = imageData[0].length;
    const width = imageData[0][0].length;
    
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Create image data
    const imgData = ctx.createImageData(width, height);
    
    // If it's a grayscale image (1 channel)
    if (channels === 1) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Normalize value between 0-255
          const value = Math.max(0, Math.min(255, imageData[0][y][x] * 255));
          
          const idx = (y * width + x) * 4;
          imgData.data[idx] = value;     // R
          imgData.data[idx + 1] = value; // G
          imgData.data[idx + 2] = value; // B
          imgData.data[idx + 3] = 255;   // A
        }
      }
    } 
    // If it's an RGB image (3 channels)
    else if (channels === 3) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          
          // If we're showing individual channels
          if (showChannels) {
            // Split canvas into three sections
            const section = Math.floor(x / (width / 3));
            
            if (section === 0) {
              // Red channel
              const value = Math.max(0, Math.min(255, imageData[0][y][x] * 255));
              imgData.data[idx] = value;     // R
              imgData.data[idx + 1] = 0;     // G
              imgData.data[idx + 2] = 0;     // B
              imgData.data[idx + 3] = 255;   // A
            } else if (section === 1) {
              // Green channel
              const value = Math.max(0, Math.min(255, imageData[1][y][x] * 255));
              imgData.data[idx] = 0;         // R
              imgData.data[idx + 1] = value; // G
              imgData.data[idx + 2] = 0;     // B
              imgData.data[idx + 3] = 255;   // A
            } else {
              // Blue channel
              const value = Math.max(0, Math.min(255, imageData[2][y][x] * 255));
              imgData.data[idx] = 0;         // R
              imgData.data[idx + 1] = 0;     // G
              imgData.data[idx + 2] = value; // B
              imgData.data[idx + 3] = 255;   // A
            }
          } else {
            // Normal RGB display
            imgData.data[idx] = Math.max(0, Math.min(255, imageData[0][y][x] * 255));     // R
            imgData.data[idx + 1] = Math.max(0, Math.min(255, imageData[1][y][x] * 255)); // G
            imgData.data[idx + 2] = Math.max(0, Math.min(255, imageData[2][y][x] * 255)); // B
            imgData.data[idx + 3] = 255;   // A
          }
        }
      }
    }
    
    ctx.putImageData(imgData, 0, 0);
  }, [imageData, showChannels]);
  
  // Skip rendering if no image data
  if (!imageData || !imageData.length) {
    return <div>No image data available</div>;
  }
  
  const channels = imageData.length;
  
  return (
    <div className="input-image p-4 border rounded-lg shadow-md bg-white">
      <h3 className="text-xl font-bold mb-4">Input Image</h3>
      
      {channels > 1 && (
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showChannels}
              onChange={() => setShowChannels(!showChannels)}
              className="mr-2"
            />
            Show Individual Channels
          </label>
        </div>
      )}
      
      <div className="canvas-container">
        <canvas 
          ref={canvasRef} 
          style={{ 
            width: '100%', 
            maxWidth: '300px', 
            height: 'auto',
            imageRendering: 'pixelated',
          }}
        />
      </div>
    </div>
  );
};

export default InputImage; 