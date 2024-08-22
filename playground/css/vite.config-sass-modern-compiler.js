import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'
import configSassModern from './vite.config-sass-modern.js'

export default defineConfig({
  ...baseConfig,
  css: {
    ...baseConfig.css,
    preprocessorOptions: {
      ...baseConfig.css.preprocessorOptions,
      scss: {
        ...configSassModern.css.preprocessorOptions.scss,
      },
    },
  },
})
