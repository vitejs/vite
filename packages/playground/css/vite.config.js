const path = require('path')
const fs = require('fs')
/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  resolve: {
    alias: {
      '@': __dirname
    }
  },
  css: {
    modules: {
      // example of how getJSON can be used to generate
      // typescript typings for css modules class names
      getJSON(cssFileName, json, _outputFileName) {
        let typings = 'declare const classNames: {\n'
        for (let className in json) {
          typings += `    "${className}": string;\n`
        }
        typings += '};\n'
        typings += 'export default classNames;\n'
        const typingsFile = path.join(
          path.dirname(cssFileName),
          path.basename(cssFileName) + '.d.ts'
        )
        fs.writeFileSync(typingsFile, typings)
      },
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    },
    preprocessorOptions: {
      scss: {
        additionalData: `$injectedColor: orange;`
      }
    }
  }
}
