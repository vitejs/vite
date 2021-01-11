const fs = require('fs')
const path = require('path')

module.exports = {
  plugins: [
    {
      name: 'copy',
      writeBundle() {
        fs.copyFileSync(
          path.resolve(__dirname, 'qux.js'),
          path.resolve(__dirname, 'dist/qux.js')
        )
      }
    }
  ]
}
