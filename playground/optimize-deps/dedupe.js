import React from 'react'
import ReactDOM from 'react-dom/client'

// #1302: The linked package has a different version of React in its deps
// and is itself optimized. Without `dedupe`, the linked package is optimized
// with a separate copy of React included, and results in runtime errors.
import { useCount } from 'dep-linked-include/index.mjs'

function App() {
  const [count, setCount] = useCount()

  return React.createElement(
    'button',
    {
      onClick() {
        setCount(count + 1)
      },
    },
    `count is ${count}`,
  )
}

ReactDOM.createRoot(document.querySelector('.dedupe')).render(
  React.createElement(App),
)
