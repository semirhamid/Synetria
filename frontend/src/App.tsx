import React from 'react';
import NeuralNetwork from './components/NeuralNetwork';
// import NeuralNetwork from './components/scratch/NeuralNetwork_legacy';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="canvas-container w-full h-screen">
        <NeuralNetwork />
      </div>
    </ErrorBoundary>
  );
};

export default App;
