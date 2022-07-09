import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('app')).render(
  React.createElement(App)
)

console.log('main.jsx') // for sourcemap
