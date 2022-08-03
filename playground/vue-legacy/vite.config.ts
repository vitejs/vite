import { defineConfig } from 'vite'
import vuePlugin from '@vitejs/plugin-vue'
import legacyPlugin from '@vitejs/plugin-legacy'

export default defineConfig({
  base: '',
  resolve: {
    alias: {
      '@': __dirname
    }
  },
  plugins: [
    vuePlugin(),
    legacyPlugin({
      targets: ['defaults', 'not IE 11', 'chrome > 48']
    })
  ],
  build: {
    minify: false
  }
})
