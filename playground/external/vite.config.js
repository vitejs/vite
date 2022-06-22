import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    minify: false,
    rollupOptions: {
      external: ['vue']
    }
  }
})
