const path = require('path')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
        additionalData: `$injectedColor: orange;`
      }
    }
  }
}
