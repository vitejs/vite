import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: [
        fileURLToPath(new URL('src/css-entry-1.js', import.meta.url)),
        fileURLToPath(new URL('src/css-entry-2.js', import.meta.url)),
      ],
      name: 'css-multi-entry',
    },
    outDir: 'dist/css-multi-entry',
  },
})
