import path from 'node:path'
import { defineConfig } from 'vite'

// Check that helpers injection is properly constrained

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main-helpers-injection.js'),
      name: 'MyLib',
      formats: ['iife'],
      fileName: 'my-lib-custom-filename',
    },
    minify: false,
    outDir: 'dist/helpers-injection',
  },
  plugins: [],
  cacheDir: 'node_modules/.vite-helpers-injection',
})
