import { defineConfig } from 'vite'

export default defineConfig({
  dev: {
    sourcemap: { css: true },
  },
  build: {
    sourcemap: true,
  },
})
