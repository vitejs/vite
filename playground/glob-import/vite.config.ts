import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@dir': path.resolve(__dirname, './dir/')
    }
  },
  build: {
    sourcemap: true
  }
})
