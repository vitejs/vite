const fs = require('fs')
const path = require('path')

module.exports = async () => {
  await global.__BROWSER_SERVER__.close()
  if (!process.env.VITE_PRESERVE_BUILD_ARTIFACTS) {
    fs.rmSync(path.resolve(__dirname, '../temp'), { recursive: true })
  }
}
