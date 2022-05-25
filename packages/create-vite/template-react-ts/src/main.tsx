import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

let rootElement: HTMLElement | null;

document.addEventListener("DOMContentLoaded", () => {
  if (!rootElement) {
    rootElement = document.getElementById("root");
    ReactDOM.createRoot(rootElement as HTMLElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
});
