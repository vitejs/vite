const fs = require('fs')
const path = require('path')
const vite = require('vite')

module.exports = vite.defineConfig({
  plugins: [
    {
      name: 'copy',
      writeBundle() {
        fs.copyFileSync(
          path.resolve(__dirname, 'qux.js'),
          path.resolve(__dirname, 'dist/qux.js')
        )
        fs.copyFileSync(
          path.resolve(__dirname, 'mxd.js'),
          path.resolve(__dirname, 'dist/mxd.js')
        )
        fs.copyFileSync(
          path.resolve(__dirname, 'mxd.json'),
          path.resolve(__dirname, 'dist/mxd.json')
        )
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'alias')
    }
  },
  build: {
    sourcemap: true
  }
})
