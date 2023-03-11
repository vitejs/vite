const path = require('node:path')

module.exports = async function readFileContent(filePath) {
  const fs = require('node:fs/promises')
  return await fs.readFile(path.resolve(filePath), 'utf-8')
}
