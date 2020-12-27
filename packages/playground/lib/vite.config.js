const path = require('path')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main.js'),
      name: 'MyLib'
    }
  }
}
