
import React from 'react';
import ReactDOM from 'react-dom/client';
import FullWorkflowTest from './FullWorkflowTest';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <FullWorkflowTest />
  </React.StrictMode>
);
