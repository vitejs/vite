import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: __dirname,
  build: {
    outDir: 'dist/lib',
    cssCodeSplit: true,
    lib: {
      entry: path.resolve(__dirname, 'src-lib-css/index.ts'),
      name: 'index',
      formats: ['umd'],
      fileName: 'index.js'
    }
  }
})
