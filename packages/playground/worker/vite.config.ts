import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: process.env.NODE_ENV === 'production' ? 'chrome60' : 'esnext'
  },
  worker: {
    plugins: [vueJsx()]
  }
})
