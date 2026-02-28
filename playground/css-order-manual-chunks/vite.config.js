import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.endsWith('/lib.css')) return 'lib'
        },
      },
    },
  },
})
