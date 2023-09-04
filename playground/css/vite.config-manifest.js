import path from 'node:path'
import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'

export default defineConfig({
  ...baseConfig,
  build: {
    ...baseConfig.build,
    manifest: true,
    cssCodeSplit: false,
    outDir: 'dist/manifest',
    rollupOptions: {
      input: {
        base: path.resolve(__dirname, 'async/base.css'),
        async: path.resolve(__dirname, 'async.css'),
      },
    },
  },
  cacheDir: 'node_modules/.vite-css-manifest',
})
