import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: true,
    minify: false,
    rollupOptions: {
      input: resolve(__dirname, 'main.js')
    }
  }
})
