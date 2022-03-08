import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vite'

export default defineConfig({
  worker: {
    format: 'es',
    plugins: [vueJsx()]
  }
})
