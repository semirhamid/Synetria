import React from 'react';
import NeuralNetwork from './components/NeuralNetwork';
import ErrorBoundary from './components/ErrorBoundary';

import './index.css';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="canvas-container w-full h-screen p-0 m-0">
        <NeuralNetwork />
      </div>
    </ErrorBoundary>
  );
};

export default App;
