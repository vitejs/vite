import sass from './sass.scss'
text('.imported-sass', sass)

function text(el, text) {
  document.querySelector(el).textContent = text
}
