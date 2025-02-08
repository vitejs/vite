import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'

export default defineConfig({
  ...baseConfig,
  css: {
    ...baseConfig.css,
    preprocessorOptions: {
      ...baseConfig.css.preprocessorOptions,
      scss: {
        api: 'legacy',
        additionalData: `$injectedColor: orange;`,
        importer: [
          function (url) {
            return url === 'virtual-dep' ? { contents: '' } : null
          },
          function (url) {
            return url === 'virtual-file-absolute'
              ? {
                  contents: `@use "${pathToFileURL(path.join(import.meta.dirname, 'file-absolute.scss')).href}"`,
                }
              : null
          },
          function (url) {
            return url.endsWith('.wxss') ? { contents: '' } : null
          },
        ],
        silenceDeprecations: ['legacy-js-api'],
      },
    },
  },
})
