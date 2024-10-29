import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    supported: {
      // Force esbuild inject helpers to test regex
      'object-rest-spread': false,
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main-named.js'),
      name: 'MyLibNamed',
      formats: ['umd', 'iife'],
      fileName: 'my-lib-named',
    },
    outDir: 'dist/named',
  },
})
