const path = require('path')
/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  build: {
    cssTarget: 'chrome61'
  },
  resolve: {
    alias: {
      '@': __dirname
    }
  },
  css: {
    modules: {
      generateScopedName: '[name]__[local]___[hash:base64:5]'

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
        importer(url) {
          if (url === 'virtual-dep') return { contents: '' }
        }
      },
      styl: {
        additionalData: `$injectedColor ?= orange`,
        imports: [
          './options/relative-import.styl',
          path.join(__dirname, 'options/absolute-import.styl')
        ]
      }
    }
  }
}
