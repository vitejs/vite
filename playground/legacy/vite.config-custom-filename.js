import legacy from '@vitejs/plugin-legacy'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [legacy({ modernPolyfills: true })],
  build: {
    manifest: true,
    minify: false,
    rolldownOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
      },
    },
  },
})
