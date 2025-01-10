import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  css: {
    transformer: 'lightningcss',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'nested'),
    },
  },
  build: {
    cssTarget: ['chrome61'],
    cssMinify: 'lightningcss',
  },
})
