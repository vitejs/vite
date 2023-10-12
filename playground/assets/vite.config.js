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
  build: {
    outDir: 'dist/foo',
    assetsInlineLimit: 8000, // 8 kB
    manifest: true,
    watch: {},
  },
})
