import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  input: {
    main: resolve(import.meta.dirname, './index.html'),
    other: resolve(import.meta.dirname, './other.js'),
  },
  build: {
    outDir: './dist',
    manifest: true,
    rolldownOptions: {
      treeshake: false,
      output: {
        format: 'cjs',
        // freeze: false,
        externalLiveBindings: false,
      },
    },
  },
})
