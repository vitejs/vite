import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    manifest: true,
    rollupOptions: {
      input: [
        'empty.css', // Empty CSS file with comments
        'empty2.css', // Completely empty CSS file
      ],
    },
  },
})
