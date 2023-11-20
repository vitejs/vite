import { resolve } from 'node:path'
import legacy from '@vitejs/plugin-legacy'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [legacy()],
  build: {
    manifest: true,
    rollupOptions: {
      input: {
        'style-only-entry': resolve(__dirname, 'style-only-entry.css'),
      },
    },
    watch: {},
    outDir: 'dist/watch',
  },
})
