const path = require('path')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  envDir: path.resolve(__dirname, 'env'),
  build: {
    minify: false
  }
}
