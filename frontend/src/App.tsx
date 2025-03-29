import React from 'react';
import NeuralNetwork from './components/NeuralNetwork';
import ErrorBoundary from './components/ErrorBoundary';

import './index.css';

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
