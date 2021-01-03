import React from 'react'
import ReactDOM from 'react-dom'

// #1302: The linked package has a different version of React in its deps
// and is itself optimized. Without `dedupe`, the linked package is optimized
// with a separate copy of React included, and results in runtime errors.
import { useCount } from 'optimize-deps-linked-include'

function App() {
  const [count, setCount] = useCount()

  return React.createElement(
    'button',
    {
      onClick() {
        setCount(count + 1)
      }
    },
    `count is ${count}`
  )
}

ReactDOM.render(React.createElement(App), document.querySelector('.dedupe'))
