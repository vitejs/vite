const fs = require('fs')
const path = require('path')

const importMetaDts = fs.readFileSync(
  path.resolve(__dirname, '../src/client/importMeta.d.ts'),
  'utf-8'
)

const indexPath = path.resolve(__dirname, '../dist/vite.d.ts')
const content = fs.readFileSync(indexPath, 'utf-8')
fs.writeFileSync(indexPath, content + `\n` + importMetaDts)
