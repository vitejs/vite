import css from './imported.css'
text('.imported-css', css)

function text(el, text) {
  document.querySelector(el).textContent = text
}
