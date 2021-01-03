// test importing both default and named exports from a CommonJS module
// React is the ultimate test of this because its dynamic exports assignments
// are not statically detectable by @rollup/plugin-commonjs.
import React, { useState } from 'react'
import ReactDOM from 'react-dom'
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
