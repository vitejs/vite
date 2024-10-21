import { pathToFileURL } from 'node:url'
import path from 'node:path'
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
          {
            canonicalize(url) {
              return url === 'virtual-file-absolute'
                ? new URL('custom-importer:virtual-file-absolute')
                : null
            },
            load() {
              return {
                contents: `@use "${pathToFileURL(path.join(import.meta.dirname, 'file-absolute.scss')).href}"`,
                syntax: 'scss',
              }
            },
          },
        ],
      },
    },
  },
})
