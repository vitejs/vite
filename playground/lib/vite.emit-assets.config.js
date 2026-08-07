import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(import.meta.dirname, 'src/emit-assets.js'),
      name: 'MyLibEmitAssets',
      formats: ['es'],
      fileName: 'my-lib-emit-assets',
      emitAssets: true,
    },
    outDir: 'dist/emit-assets',
  },
})
