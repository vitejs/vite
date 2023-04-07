import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'

/** see `ports` variable in test-utils.ts */
const port = 9524

export default defineConfig({
  ...baseConfig,
  base: `http://localhost:${port}/`,
  server: {
    port,
    strictPort: true,
  },
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
  preview: {
    port,
    strictPort: true,
  },
  testConfig: {
    baseRoute: '/url-base/',
  },
  cacheDir: 'node_modules/.vite-url-base',
})
