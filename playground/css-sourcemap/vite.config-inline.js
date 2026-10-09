import { mergeConfig } from 'vite'
import baseConfig from './vite.config.js'

export default mergeConfig(baseConfig, {
  build: {
    sourcemap: 'inline',
    outDir: 'dist/inline',
  },
})
