import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    cssCodeSplit: true,
    sourcemap: true,
    outDir: 'dist/lib-entry',
    lib: {
      entry: ['./index.js', './linked.css'],
      formats: ['es'],
    },
  },
})
