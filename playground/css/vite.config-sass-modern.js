import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'

export default defineConfig({
  ...baseConfig,
  css: {
    ...baseConfig.css,
    preprocessorOptions: {
      ...baseConfig.css.preprocessorOptions,
      scss: {
        api: 'modern',
        additionalData: `$injectedColor: orange;`,
        importers: [
          {
            canonicalize(url) {
              return url === 'virtual-dep'
                ? new URL('custom-importer:virtual-dep')
                : null
            },
            load() {
              return {
                contents: ``,
                syntax: 'scss',
              }
            },
          },
        ],
      },
    },
  },
})
