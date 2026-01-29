import path from 'node:path'
import { defineConfig } from 'vite'
import baseConfig from './vite.config'

export default defineConfig({
  ...baseConfig,
  build: {
    ...baseConfig.build,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_debugger: true,
      },
    },
    outDir: 'dist/terser',
    lib: {
      ...baseConfig.build.lib,
      entry: path.resolve(import.meta.dirname, 'src/main.js'),
      formats: ['es', 'iife'],
    },
  },
  plugins: [],
  cacheDir: 'node_modules/.vite-terser',
})
