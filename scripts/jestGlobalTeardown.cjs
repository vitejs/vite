const rimraf = require('rimraf')
const path = require('path')

module.exports = async () => {
  await global.__BROWSER_SERVER__.close()
  if (!process.env.VITE_PRESERVE_BUILD_ARTIFACTS) {
    rimraf.sync(path.resolve(__dirname, '../packages/temp'))
  }
}
