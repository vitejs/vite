import path from 'node:path'
import { defineConfig } from 'vite'

/** @type {import('vite').UserConfig} */
// @ts-expect-error typecast
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
