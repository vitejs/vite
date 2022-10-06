import { useState } from 'react'
import Button from 'jsx-entry'
import Dummy from './components/Dummy?qs-should-not-break-plugin-react'
import Parent from './hmr/parent'
import { CountProvider } from './context/CountProvider'
import { ContextButton } from './context/ContextButton'

function App() {
  const [count, setCount] = useState(0)
  return (
    <div className="App">
      <header className="App-header">
        <h1>Hello Vite + React</h1>
        <p>
          <button
            id="state-button"
            onClick={() => setCount((count) => count + 1)}
          >
            count is: {count}
          </button>
        </p>
        <p>
          <ContextButton />
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

      <Dummy />
      <Parent />
      <Button>button</Button>
    </div>
  )
}

function AppWithProviders() {
  return (
    <CountProvider>
      <App />
    </CountProvider>
  )
}

export default AppWithProviders
