import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    manifest: true,
    rollupOptions: {
      input: [
        path.resolve(__dirname, 'frontend/entrypoints/main.css'),
        path.resolve(__dirname, 'frontend/entrypoints/main.js'),
        path.resolve(__dirname, 'frontend/entrypoints/styles/main.css'),
        path.resolve(__dirname, 'frontend/entrypoints/styles/theme.css'),
      ],
    },
  },
})
