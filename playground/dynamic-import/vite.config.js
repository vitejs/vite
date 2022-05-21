import { copyFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    {
      name: 'copy',
      writeBundle() {
        copyFileSync(
          resolve(__dirname, 'qux.js'),
          resolve(__dirname, 'dist/qux.js')
        )
        copyFileSync(
          resolve(__dirname, 'mxd.js'),
          resolve(__dirname, 'dist/mxd.js')
        )
        copyFileSync(
          resolve(__dirname, 'mxd.json'),
          resolve(__dirname, 'dist/mxd.json')
        )
      }
    }
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'alias')
    }
  }
})
