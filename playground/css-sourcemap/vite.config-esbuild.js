import { mergeConfig } from 'vite'
import baseConfig from './vite.config.js'

export default mergeConfig(baseConfig, {
  build: {
    cssMinify: 'esbuild',
    outDir: 'dist/esbuild',
  },
})
