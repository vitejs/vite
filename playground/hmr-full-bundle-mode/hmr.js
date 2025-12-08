export const foo = 'hello'

text('.hmr', foo)

function text(el, text) {
  document.querySelector(el).textContent = text
}

import.meta.hot?.accept((mod) => {
  if (mod) {
    text('.hmr', mod.foo)
  }
})
