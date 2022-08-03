const path = require('node:path')

module.exports = async function readFileContent(filePath) {
  const fs =
    process.versions.node.split('.')[0] >= '14'
      ? require('node:fs/promises')
      : require('node:fs').promises
  return await fs.readFile(path.resolve(filePath), 'utf-8')
}
