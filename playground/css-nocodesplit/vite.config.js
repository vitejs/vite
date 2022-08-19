const { resolve } = require('node:path')

module.exports = {
  css: {
    bundleName: 'index.css'
  },
  build: {
    manifest: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, './index.html'),
        other: resolve(__dirname, './other.js')
      },
      output: {
        assetFileNames: 'assets/[name].hash[extname]'
      }
    }
  }
}
