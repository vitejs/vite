import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'

export default defineConfig({
  ...baseConfig,
  base: 'http://localhost:4173/',
  build: {
    ...baseConfig.build,
    outDir: 'dist/url-base',
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
  testConfig: {
    baseRoute: '/url-base/',
  },
  cacheDir: 'node_modules/.vite-url-base',
})
