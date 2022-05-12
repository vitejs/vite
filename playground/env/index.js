text('.url', import.meta.url)

function text(el, text) {
  document.querySelector(el).textContent = text
}
