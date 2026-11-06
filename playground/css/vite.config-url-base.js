import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: path.resolve(import.meta.dirname, 'composed/collisions'),
  base: '/probe/',
  css: { postcss: { plugins: [] } },
  build: { assetsInlineLimit: 0 },
})
