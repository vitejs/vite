import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: 'localhost'
  },
  build: {
    //speed up build
    minify: false,
    target: 'esnext'
  }
})
