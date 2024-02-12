const val = 'a0'
globalThis.__HMR__['.importing-reloaded'] ??= ''
globalThis.__HMR__['.importing-reloaded'] += `a.js: ${val}<br>`

export default val

if (import.meta.hot) {
  import.meta.hot.accept()
}
