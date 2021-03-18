import { useState } from 'react'
import DefaultImport from './JSXInjectTest/DefaultImport'
import NamespaceImport from './JSXInjectTest/NamespaceImport'

function App() {
  const [count, setCount] = useState(0)
  return (
    <div className="App">
      <header className="App-header">
        <h1>Hello Vite + React</h1>
        <p>
          <button onClick={() => setCount((count) => count + 1)}>
            count is: {count}
          </button>
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
      <DefaultImport />
      <NamespaceImport />
    </div>
  )
}

export default App
