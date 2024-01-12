import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'

export default defineConfig({
  ...baseConfig,
  build: {
    cssTarget: baseConfig.build.target,
    rollupOptions: {
      ...baseConfig.build.rollupOptions,
      input: {
        main: 'index.html',
      },
    },
    outDir: 'dist/build-inline-css',
    minify: true,
    cssMinify: false,
  },
  cacheDir: 'node_modules/.vite-build-inline-css',
})
