const fs = require('fs')
const path = require('path')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  build: {
    minify: false,
    lib: {
      entry: path.resolve(__dirname, 'src/emitAssetsWithModule.js'),
      formats: ['es'],
      name: 'emitAssetsWithModule',
      fileName: () => `emit-assets-with-module.js`,
      emitAssetsWithModule: true
    },
    outDir: 'dist/lib2'
  }
}
