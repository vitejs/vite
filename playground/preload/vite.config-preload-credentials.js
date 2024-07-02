import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist/preload-credentials',
    minify: 'terser',
    terserOptions: {
      format: {
        beautify: true,
      },
      compress: {
        passes: 3,
      },
    },
    modulePreload: {
      crossOrigin: 'use-credentials',
    },
  },
  cacheDir: 'node_modules/.vite-preload-credentials',
})
