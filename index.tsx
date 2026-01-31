import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Import restored
import './index.css';

console.log("Starting application [DEBUG VERSION 3]...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

window.onerror = function (message, source, lineno, colno, error) {
  console.error("Global error:", message, "at", source, ":", lineno);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML += `<br/><div style="color: red; background: black;">CRASH: ${message}</div>`;
  }
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
console.log("Application mounted successfully.");
