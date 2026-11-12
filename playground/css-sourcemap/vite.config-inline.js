import { mergeConfig } from 'vite'
import baseConfig from './vite.config.js'

export default mergeConfig(baseConfig, {
  build: {
    sourcemap: { js: 'inline', css: 'inline' },
    outDir: 'dist/inline',
  },
})
