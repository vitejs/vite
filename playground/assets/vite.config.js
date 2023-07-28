import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/foo',
  publicDir: 'static',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'nested'),
    },
  },
  assetsInclude: ['**/*.unknown'],
  build: {
    outDir: 'dist/foo',
    assetsInlineLimit: 8192, // 8kb
    manifest: true,
    watch: {},
  },
})
