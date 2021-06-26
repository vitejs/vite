const path = require('path')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  server: {
    fs: {
      root: __dirname,
      strict: true
    },
    hmr: {
      overlay: false
    }
  },
  define: {
    ROOT: JSON.stringify(path.dirname(__dirname).replace(/\\/g, '/'))
  }
}
