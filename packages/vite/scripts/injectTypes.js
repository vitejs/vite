// @ts-check
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

fs.copyFileSync(
  path.resolve(__dirname, '../types/importMeta.d.ts'),
  path.resolve(__dirname, '../dist/node/importMeta.d.ts')
)

fs.copyFileSync(
  path.resolve(__dirname, '../types/fileTypes.d.ts'),
  path.resolve(__dirname, '../dist/node/fileTypes.d.ts')
)

// inject imports to ImportMeta augmentation and file type declarations into
// index.d.ts
const indexPath = path.resolve(__dirname, '../dist/node/index.d.ts')

const content = fs.readFileSync(indexPath, 'utf-8')
fs.writeFileSync(
  indexPath,
  content + `\nimport './importMeta'` + `\nimport './fileTypes'`
)
console.log(chalk.green.bold(`injected import.meta and file types`))
