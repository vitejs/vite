import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    cssCodeSplit: true,
    lib: {
      entry: [
        fileURLToPath(new URL('src/css-entry-1.js', import.meta.url)),
        fileURLToPath(new URL('src/css-entry-2.js', import.meta.url)),
      ],
      name: 'css-code-split',
    },
    outDir: 'dist/css-code-split',
  },
})
