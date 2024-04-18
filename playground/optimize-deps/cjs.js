// test importing both default and named exports from a CommonJS module
// React is the ultimate test of this because its dynamic exports assignments
// are not statically detectable by @rollup/plugin-commonjs.
import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Socket } from 'phoenix'
import clip from 'clipboard'
import m from '@vitejs/test-dep-cjs-with-es-module-flag'
// Test exporting a name that was already imported
export { useState } from 'react'
export { useState as anotherNameForUseState } from 'react'
export { default as React } from 'react'

if (typeof clip === 'function') {
  text('.cjs-clipboard', 'ok')
}

if (typeof Socket === 'function') {
  text('.cjs-phoenix', 'ok')
}

text('.cjs-with-es-module-flag', m.info)

function App() {
  const [count, setCount] = useState(0)

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

ReactDOM.createRoot(document.querySelector('.cjs')).render(
  React.createElement(App),
)

function text(el, text) {
  document.querySelector(el).textContent = text
}
