const path = require('path')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main3.js'),
      formats: ['es', 'umd'],
      name: 'SetSrc',
      fileName: (format) => `my-lib-emit-assets.${format}.js`,
      emitAssets: true
    },
    outDir: 'dist/lib2'
  }
}
