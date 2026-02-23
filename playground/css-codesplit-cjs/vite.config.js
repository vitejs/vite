import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: './dist',
    manifest: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, './index.html'),
        other: resolve(import.meta.dirname, './other.js'),
      },
      treeshake: false,
      output: {
        format: 'cjs',
        // freeze: false,
        externalLiveBindings: false,
      },
    },
  },
})
