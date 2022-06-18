const { resolve } = require('path')

module.exports = {
  build: {
    manifest: true,
    cssExtract: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, './index.html'),
        other: resolve(__dirname, './other.js')
      }
    }
  }
}
