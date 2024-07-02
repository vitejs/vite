import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'

/** see `ports` variable in test-utils.ts */
const port = 9524

export default defineConfig({
  ...baseConfig,
  // Vite should auto-encode  this as `/foo%20bar/` internally
  base: '/foo bar/',
  server: {
    port,
    strictPort: true,
  },
  build: {
    ...baseConfig.build,
    outDir: 'dist/encoded-base',
    watch: null,
    minify: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        entryFileNames: 'entries/[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'other-assets/[name]-[hash][extname]',
      },
    },
  },
  preview: {
    port,
    strictPort: true,
  },
  cacheDir: 'node_modules/.vite-encoded-base',
})
