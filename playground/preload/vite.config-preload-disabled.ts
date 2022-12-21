import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist/preload-disabled',
    minify: 'terser',
    terserOptions: {
      format: {
        beautify: true,
      },
      compress: {
        passes: 3,
      },
    },
    modulePreload: false,
  },
})
