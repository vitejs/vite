const path = require('path')

module.exports = async function readFileContent(filePath) {
  const fs =
    process.versions.node.split('.')[0] >= '14'
      ? require('fs/promises')
      : require('fs').promises
  return await fs.readFile(path.resolve(filePath), 'utf-8')
}
