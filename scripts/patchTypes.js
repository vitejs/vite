const fs = require('fs')
const path = require('path')

// copy file
const metaPath = path.resolve(__dirname, '../importMeta.d.ts')
fs.writeFileSync(
  path.resolve(__dirname, '../dist/importMeta.d.ts'),
  fs.readFileSync(metaPath)
)

// inject import
const indexPath = path.resolve(__dirname, '../dist/node/index.d.ts')
const content = fs.readFileSync(indexPath, 'utf-8')
fs.writeFileSync(indexPath, content + `\nimport '../importMeta'`)

const configPath = path.resolve(__dirname, '../dist/node/config.js')
const configContent = fs.readFileSync(configPath, 'utf-8')
fs.writeFileSync(
  configPath,
  configContent.replace(/__DYNAMIC__IMPORT__/, 'import')
)
