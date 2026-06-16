import('./dynamic.css').then(() => {
  text('.dynamic', 'loaded')
})

function text(el, text) {
  document.querySelector(el).textContent = text
}
