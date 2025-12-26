import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    cssCodeSplit: false,
    rolldownOptions: {
      input: {
        index: resolve(__dirname, './index.html'),
        sub: resolve(__dirname, './sub.html'),
      },
    },
  },
})
