const path = require('path')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  plugins: [specialCssPlugin()],
  build: {
    cssTarget: 'chrome61'
  },
  resolve: {
    alias: {
      '@': __dirname,
      spacefolder: __dirname + '/folder with space',
      '#alias': __dirname + '/aliased/foo.css',
      '#alias-module': __dirname + '/aliased/bar.module.css'
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

/**
 * @returns {import('vite').Plugin}
 */
function specialCssPlugin() {
  return {
    name: 'special-css-plugin',
    enforce: 'pre',
    resolveId(id) {
      if (id === 'special.css') {
        return '\0special.css'
      }
    },
    load(id) {
      if (id === '\0special.css') {
        return `export default 'i_am_special'`
      }
    }
  }
}
