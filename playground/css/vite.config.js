import path from 'node:path'
import { pathToFileURL } from 'node:url'
import stylus from 'stylus'
import { defineConfig } from 'vite'

// trigger scss bug: https://github.com/sass/dart-sass/issues/710
// make sure Vite handles safely
// @ts-expect-error refer to https://github.com/vitejs/vite/pull/11079
globalThis.window = {}
// @ts-expect-error refer to https://github.com/vitejs/vite/pull/11079
globalThis.location = new URL('http://localhost/')

export default defineConfig({
  build: {
    cssTarget: 'chrome61',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('manual-chunk.css')) {
            return 'dir/dir2/manual-chunk'
          }
        },
      },
    },
  },
  esbuild: {
    logOverride: {
      'unsupported-css-property': 'silent',
    },
  },
  resolve: {
    alias: {
      '=': __dirname,
      spacefolder: __dirname + '/folder with space',
      '#alias': __dirname + '/aliased/foo.css',
      '#alias?inline': __dirname + '/aliased/foo.css?inline',
      '#alias-module': __dirname + '/aliased/bar.module.css',
    },
  },
  css: {
    modules: {
      generateScopedName: '[name]__[local]___[hash:base64:5]',

      // example of how getJSON can be used to generate
      // typescript typings for css modules class names

      // getJSON(cssFileName, json, _outputFileName) {
      //   let typings = 'declare const classNames: {\n'
      //   for (let className in json) {
      //     typings += `    "${className}": string;\n`
      //   }
      //   typings += '};\n'
      //   typings += 'export default classNames;\n'
      //   const { join, dirname, basename } = require('path')
      //   const typingsFile = join(
      //     dirname(cssFileName),
      //     basename(cssFileName) + '.d.ts'
      //   )
      //   require('fs').writeFileSync(typingsFile, typings)
      // },
    },
    preprocessorOptions: {
      scss: {
        additionalData: `$injectedColor: orange;`,
        importer: [
          function (url) {
            return url === 'virtual-dep' ? { contents: '' } : null
          },
          function (url) {
            return url === 'virtual-file-absolute'
              ? {
                  contents: `@import "${pathToFileURL(path.join(import.meta.dirname, 'file-absolute.scss')).href}"`,
                }
              : null
          },
          function (url) {
            return url.endsWith('.wxss') ? { contents: '' } : null
          },
        ],
        silenceDeprecations: ['legacy-js-api'],
      },
      styl: {
        additionalData: `$injectedColor ?= orange`,
        imports: [
          './options/relative-import.styl',
          path.join(__dirname, 'options/absolute-import.styl'),
        ],
        define: {
          $definedColor: new stylus.nodes.RGBA(51, 197, 255, 1),
          definedFunction: () => new stylus.nodes.RGBA(255, 0, 98, 1),
        },
      },
    },
    preprocessorMaxWorkers: true,
  },
})
