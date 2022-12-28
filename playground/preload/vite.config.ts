import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist/normal',
    minify: 'terser',
    terserOptions: {
      format: {
        beautify: true,
      },
      compress: {
        passes: 3,
      },
    },
  },
})
