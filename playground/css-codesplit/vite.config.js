const { resolve } = require('node:path')

module.exports = {
  build: {
    manifest: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, './index.html'),
        other: resolve(__dirname, './other.js'),
      },
    },
  },
}
