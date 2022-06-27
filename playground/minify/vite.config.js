import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    minifyIdentifiers: true,
    minifyWhitespace: true
  }
})
