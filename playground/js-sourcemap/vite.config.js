import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(name) {
          if (name.includes('after-preload-dynamic')) {
            return 'after-preload-dynamic'
          }
        },
      },
    },
  },
})
