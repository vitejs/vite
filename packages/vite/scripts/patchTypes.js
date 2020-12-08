const fs = require('fs')
const path = require('path')

// remove temp type dir
fs.rmdirSync(path.resolve(__dirname, '../dist-types'), { recursive: true })
// somehow api-extractor generates a duplicated dist dir in its project root
fs.rmdirSync(path.resolve(__dirname, '../src/node/dist'), { recursive: true })

const importMetaDts = fs.readFileSync(
  path.resolve(__dirname, '../src/client/importMeta.d.ts'),
  'utf-8'
)

const indexPath = path.resolve(__dirname, '../dist/vite.d.ts')
const content = fs.readFileSync(indexPath, 'utf-8')
fs.writeFileSync(indexPath, content + `\n` + importMetaDts)
