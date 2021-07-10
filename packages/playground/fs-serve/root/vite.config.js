const path = require('path')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  server: {
    fs: {
      strict: true,
      allow: [__dirname]
    },
    hmr: {
      overlay: false
    }
  },
  define: {
    ROOT: JSON.stringify(path.dirname(__dirname).replace(/\\/g, '/'))
  }
}
