const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

fs.copyFileSync(
  path.resolve(__dirname, '../types/importMeta.d.ts'),
  path.resolve(__dirname, '../dist/node/importMeta.d.ts')
)

// inject the importMeta import into index.d.ts
// so that user projects have typings for vite-injected import.meta.* properties
const indexPath = path.resolve(__dirname, '../dist/node/index.d.ts')
const content = fs.readFileSync(indexPath, 'utf-8')
fs.writeFileSync(indexPath, content + `\nimport './importMeta'`)
console.log(chalk.green.bold(`injected import.meta types`))
