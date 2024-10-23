import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // old browsers only
    target: ['chrome60'],
  },
})
