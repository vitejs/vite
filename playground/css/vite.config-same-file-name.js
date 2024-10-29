import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'

export default defineConfig({
  ...baseConfig,
  build: {
    ...baseConfig.build,
    outDir: 'dist/same-file-name',
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
})
