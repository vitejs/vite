import { displayCount } from './re-export.js'

const incrementValue = () =>
  globalThis.__HMR__['.intermediate-file-delete-increment']

const render = () => {
  globalThis.__HMR__['.intermediate-file-delete-display'] = displayCount(
    Number(incrementValue()),
  )
}

render()

globalThis.__HMR__['.delete-intermediate-file'] = () => {
  globalThis.__HMR__['.intermediate-file-delete-increment'] = `${
    Number(incrementValue()) + 1
  }`
  render()
}

if (import.meta.hot) import.meta.hot.accept()
