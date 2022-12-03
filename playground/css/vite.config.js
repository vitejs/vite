const path = require('node:path')

// trigger scss bug: https://github.com/sass/dart-sass/issues/710
// make sure Vite handles safely
globalThis.window = {}
globalThis.location = new URL('http://localhost/')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  build: {
    cssTarget: 'chrome61',
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
            return url.endsWith('.wxss') ? { contents: '' } : null
          },
        ],
      },
      styl: {
        additionalData: `$injectedColor ?= orange`,
        imports: [
          './options/relative-import.styl',
          path.join(__dirname, 'options/absolute-import.styl'),
        ],
      },
    },
  },
}
