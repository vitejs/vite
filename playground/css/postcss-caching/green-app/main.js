import './imported.css'
import css from './imported.css?inline'
text('.imported-css', css)

function text(el, text) {
  document.querySelector(el).textContent = text
}
