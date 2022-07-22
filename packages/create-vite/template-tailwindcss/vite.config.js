import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    open: '/index.html'
  },
  build: {
    outDir: '../public'
  },
  root: 'src'
})
