import React, { useEffect } from 'react'
import logo from './logo.svg'
import './App.css'
import init, { greet } from 'wasm-hello';

function App() {
  useEffect(() => {
    init();
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Hello WebAssembly!</p>
        <p>Vite + Rust + React</p>
        <p>
          <button onClick={() => greet('webAssembly')}>
            hello wasm
          </button>
        </p>
        <p>
          Edit <code>App.tsx</code> and save to test HMR updates.
        </p>
      </header>
    </div>
  )
}

export default App
