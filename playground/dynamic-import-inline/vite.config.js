import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'alias'),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        codeSplitting: false,
      },
    },
  },
})
