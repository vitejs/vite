import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'

export default defineConfig({
  ...baseConfig,
  build: {
    ...baseConfig.build,
    outDir: 'dist/no-css-minify',
    minify: true,
    cssMinify: false,
  },
  cacheDir: 'node_modules/.vite-no-css-minify',
})
