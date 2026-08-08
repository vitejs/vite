import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  input: {
    entry: path.join(import.meta.dirname, 'sass-node-builtin-clash/entry.scss'),
  },
  build: {
    outDir: 'dist/sass-node-builtin-clash',
  },
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [path.join(import.meta.dirname, 'sass-node-builtin-clash')],
      },
    },
  },
})
