// @ts-check
const os = require('os')
const fs = require('fs-extra')
const path = require('path')

;(async () => {
  const tempDir = path.resolve(__dirname, '../packages/temp')
  await fs.remove(tempDir)
  await fs.copy(path.resolve(__dirname, '../packages/playground'), tempDir, {
    dereference: false,
    filter(file) {
      file = file.replace(/\\/g, '/')
      return !file.includes('__tests__') && !file.match(/dist(\/|$)/)
    }
  })
})()
