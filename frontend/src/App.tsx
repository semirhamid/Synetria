import React, { StrictMode } from 'react';
import NeuralNetwork from './components/NeuralNetwork';
// import NeuralNetwork from './components/scratch/NeuralNetwork_legacy';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  return (
    <StrictMode>

    <ErrorBoundary>
      <div className="canvas-container w-full h-screen">
        <NeuralNetwork />
      </div>
    </ErrorBoundary>
    </StrictMode>
  );
};

export default App;
