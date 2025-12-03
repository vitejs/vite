import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'alias'),
    },
  },
  build: {
    sourcemap: true,
    rolldownOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
