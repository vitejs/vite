const fs = require('fs-extra')
const path = require('path')

;(async () => {
  if (!process.env.VITE_PRESERVE_BUILD_ARTIFACTS) {
    await fs.remove(path.resolve(__dirname, '../packages/temp'))
  }
})()
