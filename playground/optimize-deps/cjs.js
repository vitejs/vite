// test importing both default and named exports from a CommonJS module
// React is the ultimate test of this because its dynamic exports assignments
// are not statically detectable by @rollup/plugin-commonjs.
import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Socket } from 'phoenix'
import clip from 'clipboard'
import m from '@vitejs/test-dep-cjs-with-es-module-flag'
import cjsFromESM from '@vitejs/test-dep-cjs-compiled-from-esm'
import cjsFromCJS from '@vitejs/test-dep-cjs-compiled-from-cjs'
import * as cjsFromCJSNamespace from '@vitejs/test-dep-cjs-compiled-from-cjs'
import * as cjsProtoMembers from '@vitejs/test-dep-cjs-prototype-members'
import * as cjsDefaultArray from '@vitejs/test-dep-cjs-default-array'
import * as cjsDefaultNull from '@vitejs/test-dep-cjs-default-null'

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

if (typeof cjsFromESM.default === 'function') {
  text('.cjs-dep-cjs-compiled-from-esm', 'ok')
}

if (
  typeof cjsFromCJS === 'function' &&
  typeof cjsFromCJSNamespace !== 'function' &&
  cjsFromCJSNamespace.bar === 'bar'
) {
  text('.cjs-dep-cjs-compiled-from-cjs', 'ok')
}

if (cjsProtoMembers.Color?.('#2e95c8') === '#2e95c8') {
  text('.cjs-dep-cjs-prototype-members', 'ok')
}

if (cjsProtoMembers.nonEnumerable === 'non-enumerable') {
  text('.cjs-dep-cjs-prototype-members-non-enumerable', 'ok')
}

const liveGetterFirst = cjsProtoMembers.liveGetter
if (cjsProtoMembers.liveGetter === liveGetterFirst + 1) {
  text('.cjs-dep-cjs-prototype-members-live-getter', 'ok')
}

if (
  cjsDefaultArray[0] === 'a' &&
  cjsDefaultArray.length === 3 &&
  Array.isArray(cjsDefaultArray.default) &&
  cjsDefaultArray.default.join('') === 'abc'
) {
  text('.cjs-dep-cjs-default-array', 'ok')
}

if (cjsDefaultNull.default === null) {
  text('.cjs-dep-cjs-default-null', 'ok')
}

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
