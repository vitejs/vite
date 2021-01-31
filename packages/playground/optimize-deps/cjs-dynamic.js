// test dynamic import to cjs deps
// mostly ensuring consistency between dev server behavior and build behavior
// of @rollup/plugin-commonjs
;(async () => {
  const { useState } = await import('react')
  const React = (await import('react')).default
  const ReactDOM = await import('react-dom')

  const clip = await import('clipboard')
  if (typeof clip.default === 'function') {
    document.querySelector('.cjs-dynamic-clipboard').textContent = 'ok'
  }

  const { Socket } = await import('phoenix')
  if (typeof Socket === 'function') {
    document.querySelector('.cjs-dynamic-phoenix').textContent = 'ok'
  }

  function App() {
    const [count, setCount] = useState(0)

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

  ReactDOM.render(
    React.createElement(App),
    document.querySelector('.cjs-dynamic')
  )
})()
