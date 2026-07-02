import './require-polyfill'
import { version } from 'vue'
import '@vitejs/test-dep-that-imports'
import '@vitejs/test-dep-that-requires'

document.querySelector('#direct-vue-version').textContent = version
