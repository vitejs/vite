import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'

const dirname = import.meta.dirname

export default defineConfig({
  plugins: [
    {
      name: 'copy',
      writeBundle() {
        fs.mkdirSync(path.resolve(dirname, 'dist/views'))
        fs.mkdirSync(path.resolve(dirname, 'dist/files'))
        fs.copyFileSync(
          path.resolve(dirname, 'views/qux.js'),
          path.resolve(dirname, 'dist/views/qux.js'),
        )
        fs.copyFileSync(
          path.resolve(dirname, 'files/mxd.js'),
          path.resolve(dirname, 'dist/files/mxd.js'),
        )
        fs.copyFileSync(
          path.resolve(dirname, 'files/mxd.json'),
          path.resolve(dirname, 'dist/files/mxd.json'),
        )
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(dirname, 'alias'),
    },
  },
  build: {
    sourcemap: true,
  },
})
