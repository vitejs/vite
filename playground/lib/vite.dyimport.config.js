const fs = require('fs')
const path = require('path')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main2.js'),
      formats: ['es', 'iife'],
      name: 'message',
      fileName: (format) => `dynamic-import-message.${format}.mjs`
    },
    outDir: 'dist/lib'
  }
}
