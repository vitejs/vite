const fs = require('fs-extra')
const path = require('path')

module.exports = async () => {
  await global.__BROWSER_SERVER__.close()
  if (!process.env.VITE_PRESERVE_BUILD_ARTIFACTS) {
    await fs.remove(path.resolve(__dirname, '../temp'))
  }
}
