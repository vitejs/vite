import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vite'

/**
 * @type {import('vite').UserConfig}
 */
export default defineConfig({
  plugins: [],
  build: {
    target: process.env.NODE_ENV === 'production' ? 'chrome60' : 'esnext'
  },
  worker: {
    plugins: [vueJsx()]
  }
})
