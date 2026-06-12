// test dynamic import to cjs deps
// mostly ensuring consistency between dev server behavior and build behavior
// of @rollup/plugin-commonjs
;(async () => {
  const { useState } = await import('react')
  const React = (await import('react')).default
  const ReactDOM = await import('react-dom/client')

  const clip = await import('clipboard')
  if (typeof clip.default === 'function') {
    text('.cjs-dynamic-clipboard', 'ok')
  }

  const { Socket } = await import('phoenix')
  if (typeof Socket === 'function') {
    text('.cjs-dynamic-phoenix', 'ok')
  }

  const cjsFromESM = await import('@vitejs/test-dep-cjs-compiled-from-esm')
  if (typeof cjsFromESM.default.default === 'function') {
    text('.cjs-dynamic-dep-cjs-compiled-from-esm', 'ok')
  }

  const cjsFromCJS = await import('@vitejs/test-dep-cjs-compiled-from-cjs')
  if (
    typeof cjsFromCJS.default === 'function' &&
    typeof cjsFromCJS !== 'function' &&
    cjsFromCJS.bar === 'bar'
  ) {
    text('.cjs-dynamic-dep-cjs-compiled-from-cjs', 'ok')
  }

  const cjsWithEsModuleFlag =
    await import('@vitejs/test-dep-cjs-with-es-module-flag')
  text(
    '.cjs-dynamic-dep-cjs-with-es-module-flag',
    cjsWithEsModuleFlag.default.info,
  )

  const cjsProtoMembers = await import('@vitejs/test-dep-cjs-prototype-members')
  if (cjsProtoMembers.Color?.('#2e95c8') === '#2e95c8') {
    text('.cjs-dynamic-dep-cjs-prototype-members', 'ok')
  }

  if (cjsProtoMembers.nonEnumerable === 'non-enumerable') {
    text('.cjs-dynamic-dep-cjs-prototype-members-non-enumerable', 'ok')
  }

  const liveGetterFirst = cjsProtoMembers.liveGetter
  if (cjsProtoMembers.liveGetter === liveGetterFirst + 1) {
    text('.cjs-dynamic-dep-cjs-prototype-members-live-getter', 'ok')
  }

  const cjsDefaultArray = await import('@vitejs/test-dep-cjs-default-array')
  if (
    cjsDefaultArray[0] === 'a' &&
    cjsDefaultArray.length === 3 &&
    Array.isArray(cjsDefaultArray.default) &&
    cjsDefaultArray.default.join('') === 'abc'
  ) {
    text('.cjs-dynamic-dep-cjs-default-array', 'ok')
  }

  const cjsDefaultNull = await import('@vitejs/test-dep-cjs-default-null')
  if (cjsDefaultNull.default === null) {
    text('.cjs-dynamic-dep-cjs-default-null', 'ok')
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

  ReactDOM.createRoot(document.querySelector('.cjs-dynamic')).render(
    React.createElement(App),
  )

  function text(el, text) {
    document.querySelector(el).textContent = text
  }
})()
