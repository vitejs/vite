import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main2.js'),
      formats: ['es', 'iife'],
      name: 'message',
      fileName: (format) => `dynamic-import-message.${format}.mjs`,
    },
    outDir: 'dist/lib',
  },
})
