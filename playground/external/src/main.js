import '@vitejs/dep-that-imports-vue'
import '@vitejs/dep-that-requires-vue'
import { hello } from 'external-dep'

text('.external', hello)

function text(el, text) {
  document.querySelector(el).textContent = text
}
