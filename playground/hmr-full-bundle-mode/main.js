import './hmr.js'

text('.app', 'hello')

function text(el, text) {
  document.querySelector(el).textContent = text
}
