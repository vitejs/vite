const fs = require('fs')
const path = require('path')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  build: {
    minify: false,
    lib: {
      entry: path.resolve(__dirname, 'src/emitAssets.js'),
      formats: ['es'],
      name: 'emitAssets',
      fileName: () => `emit-assets.js`,
      emitAssets: true
    },
    outDir: 'dist/lib2'
  }
}
