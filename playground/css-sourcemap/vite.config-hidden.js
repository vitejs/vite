import { mergeConfig } from 'vite'
import baseConfig from './vite.config.js'

export default mergeConfig(baseConfig, {
  build: {
    sourcemap: { js: 'hidden', css: 'hidden' },
    outDir: 'dist/hidden',
  },
})
