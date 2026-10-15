import { resolve } from 'node:path'
import legacy from '@vitejs/plugin-legacy'
import { defineConfig } from 'vite'

export default defineConfig({
  input: {
    'style-only-entry': resolve(import.meta.dirname, 'style-only-entry.css'),
  },
  plugins: [legacy()],
  build: {
    manifest: true,
    watch: {},
    outDir: 'dist/watch',
  },
})
