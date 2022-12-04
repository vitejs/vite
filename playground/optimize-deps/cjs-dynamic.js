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
  console.log('cjsFromESM', cjsFromESM)
  if (typeof cjsFromESM.default === 'function') {
    text('.cjs-dynamic-dep-cjs-compiled-from-esm', 'ok')
  }

  const cjsFromCJS = await import('@vitejs/test-dep-cjs-compiled-from-cjs')
  console.log('cjsFromCJS', cjsFromCJS)
  if (typeof cjsFromCJS.default === 'function') {
    text('.cjs-dynamic-dep-cjs-compiled-from-cjs', 'ok')
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
