import path from 'node:path'
import { defineConfig } from 'vite'
import baseConfig from './vite.config'

export default defineConfig({
  ...baseConfig,
  build: {
    cssExtract: false,
    ...baseConfig.build,
    lib: {
      ...baseConfig.build.lib,
      entry: path.resolve(__dirname, 'src/main3.js'),
    },
    outDir: 'dist/cssextract',
  },
  plugins: [],
  cacheDir: 'node_modules/.vite-cssextract',
})
