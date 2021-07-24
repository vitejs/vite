import { useState } from 'react'
import { css } from '@emotion/react'

export function Counter() {
  const [count, setCount] = useState(0)

  return (
    <button
      css={css`
        border: 2px solid #000;
      `}
      onClick={() => setCount((count) => count + 1)}
    >
      count is: {count}
    </button>
  )
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Hello Vite + React + @emotion/react</h1>
        <p>
          <Counter />
        </p>
        <p>
          Edit <code>App.jsx</code> and save to test HMR updates.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  )
}

export default App
