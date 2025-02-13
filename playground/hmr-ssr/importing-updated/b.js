import a from './a.js'

const val = `b0,${a}`

globalThis.__HMR__['.importing-reloaded'] ??= ''
globalThis.__HMR__['.importing-reloaded'] += `b.js: ${val}<br>`

if (import.meta.hot) {
  import.meta.hot.accept()
}
