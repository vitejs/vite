import './hmr.js'

text('.app', 'hello')

document.querySelector('#load-dynamic').addEventListener('click', () => {
  import('./dynamic.js')
})

function text(el, text) {
  document.querySelector(el).textContent = text
}
