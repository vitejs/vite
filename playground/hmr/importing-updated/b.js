import a from './a.js'

const val = `b0,${a}`
document.querySelector('.importing-reloaded').innerHTML += `b.js: ${val}<br>`

if (import.meta.hot) {
  import.meta.hot.accept()
}
