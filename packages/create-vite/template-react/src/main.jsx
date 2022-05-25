import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

let rootElement;

document.addEventListener("DOMContentLoaded", function () {
  if (!rootElement) {
    rootElement = document.getElementById("root");
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
            <App />
      </React.StrictMode>
    );
  }
});
