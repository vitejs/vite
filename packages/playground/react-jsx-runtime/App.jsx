/* eslint-disable */
import { useState } from 'react'

const StatelessCounter = ({ value, onChange }) => {
  return (
    <button onClick={() => onChange((count) => count + 1)}>
      count is: {value}
    </button>
  )
}

const withState = (Comp) => {
  return ({ defaultValue }) => {
    const [val, setCount] = useState(defaultValue)
    return <Comp value={val} onChange={setCount} />
  }
}

const withWrapper = (Comp, Wrapper) => {
  return (props) => {
    return (
      <Wrapper>
        <Comp {...props} />
      </Wrapper>
    )
  }
}

// @ts-expect-error ts does not support pipeline operators yet
const Counter = StatelessCounter |> withState |> ((_) => withWrapper(_, 'p'))

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Hello Vite + React</h1>
        <Counter defaultValue={0} />
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
