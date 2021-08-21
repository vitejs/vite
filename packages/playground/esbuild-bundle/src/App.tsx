import React, { useState, useEffect } from 'react'
import './App.css'
import * as three from 'three'
import * as lodash from 'lodash'
import * as rx from 'rxjs'
import * as antd from 'antd'
import * as material from '@material-ui/core'
console.log('big lib', three, lodash, rx, antd)

function App() {
  const [count, setCount] = useState(0)
  useEffect(async () => {
    const result = await import('./answer')
    console.log('result:', result.answer)
  }, [])
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Hello Vite + React!</p>
        <p>
          <button type="button" onClick={() => setCount((count) => count + 1)}>
            count is: {count}
          </button>
        </p>
        <p>
          Edit <code>App.tsx</code> and save to test HMR updates.
        </p>
        <p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          {' | '}
          <a
            className="App-link"
            href="https://vitejs.dev/guide/features.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vite Docs
          </a>
        </p>
      </header>
    </div>
  )
}

export default App
