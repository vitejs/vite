const fs = require('fs')
const path = require('path')

const indexPath = path.resolve(__dirname, '../dist/index.d.ts')
const content = fs.readFileSync(indexPath, 'utf-8')
fs.writeFileSync(indexPath, content + `\nimport '../importMeta'`)
