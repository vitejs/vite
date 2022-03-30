import path from 'path'
import { defineConfig } from 'vite'
import Glob from 'vite-plugin-glob'

export default defineConfig({
  resolve: {
    alias: {
      '@dir': path.resolve(__dirname, './dir/')
    }
  },
  plugins: [Glob({ takeover: true })],
  optimizeDeps: {
    entries: []
  }
})
