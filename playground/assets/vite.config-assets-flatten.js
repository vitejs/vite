import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/foo/bar',
  publicDir: 'static',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'nested'),
    },
  },
  assetsInclude: ['**/*.unknown'],
  assetsFlatten: false,
  build: {
    outDir: 'dist/assets-flatten',
    assetsInlineLimit: 8000, // 8 kB
    manifest: true,
    watch: {},
  },
})
