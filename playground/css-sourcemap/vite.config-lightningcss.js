import { defineConfig, mergeConfig } from 'vite'
import baseConfig from './vite.config.js'

export default mergeConfig(
  baseConfig,
  defineConfig({
    css: {
      transformer: 'lightningcss',
    },
  }),
)
