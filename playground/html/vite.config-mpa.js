const { resolve } = require('node:path')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        nested: resolve(__dirname, 'nested/index.html')
      }
    }
  },

  appType: 'mpa'
}
