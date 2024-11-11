import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'

export default defineConfig({
  ...baseConfig,
  css: {
    ...baseConfig.css,
    preprocessorOptions: {
      ...baseConfig.css.preprocessorOptions,
      scss: {
        .../** @type {import('vite').SassPreprocessorOptions & { api?: undefined }} */ (
          baseConfig.css.preprocessorOptions.scss
        ),
        api: 'modern',
      },
    },
  },
})
