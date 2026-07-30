import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  input: {
    index: resolve(import.meta.dirname, './index.html'),
    sub: resolve(import.meta.dirname, './sub.html'),
  },
  build: {
    cssCodeSplit: false,
  },
})
