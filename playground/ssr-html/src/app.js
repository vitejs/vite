import { virtual } from 'virtual:file'

const p = document.createElement('p')
p.innerHTML = '✅ Dynamically injected script from file'
document.body.appendChild(p)

text('.virtual', virtual)

function text(el, text) {
  document.querySelector(el).textContent = text
}
