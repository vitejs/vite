import { defineConfig } from 'vite'
import vuePlugin from '@vitejs/plugin-vue'

export default defineConfig({
  base: '',
  resolve: {
    alias: {
      '@': __dirname
    }
  },
  plugins: [vuePlugin()],
  server: {
    origin: 'http://localhost/server-origin/test'
  },
  build: {
    // to make tests faster
    minify: false
  }
})
