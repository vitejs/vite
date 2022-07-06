import { version } from 'vue'
import '@vitejs/dep-that-imports-vue'
import '@vitejs/dep-that-requires-vue'

text('#source-vue-version', version)

function text(el, text) {
  document.querySelector(el).textContent = text
}
