const fs = require('node:fs')
const path = require('node:path')
const vite = require('vite')

module.exports = vite.defineConfig({
  plugins: [
    {
      name: 'copy',
      writeBundle() {
        fs.mkdirSync(path.resolve(__dirname, 'dist/views'))
        fs.mkdirSync(path.resolve(__dirname, 'dist/files'))
        fs.copyFileSync(
          path.resolve(__dirname, 'views/qux.js'),
          path.resolve(__dirname, 'dist/views/qux.js'),
        )
        fs.copyFileSync(
          path.resolve(__dirname, 'files/mxd.js'),
          path.resolve(__dirname, 'dist/files/mxd.js'),
        )
        fs.copyFileSync(
          path.resolve(__dirname, 'files/mxd.json'),
          path.resolve(__dirname, 'dist/files/mxd.json'),
        )
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'alias'),
    },
  },
  build: {
    sourcemap: true,
  },
})
