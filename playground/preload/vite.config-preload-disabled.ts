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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('chunk.js')) {
            return 'chunk'
          }
        },
      },
    },
    modulePreload: false,
  },
})
