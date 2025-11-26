import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'node18',
    ssr: true,
    ssrEmitAssets: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'main.ts'),
      },
      output: {
        format: 'es',
        entryFileNames: '[name].mjs',
      },
    },
  },
  worker: {
    format: 'es',
  },
})
