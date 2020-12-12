// @ts-check
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const slash = require('slash')
const { parse } = require('@babel/parser')
const MagicString = require('magic-string').default

// inject the importMeta augmentations into temp index.d.ts
// so that user projects have typings for vite-injected import.meta.* properties
const importMetaCode = fs.readFileSync(
  path.resolve(__dirname, '../types/importMeta.d.ts'),
  'utf-8'
)
const indexPath = path.resolve(__dirname, '../temp/node/index.d.ts')
const content = fs.readFileSync(indexPath, 'utf-8')
fs.writeFileSync(indexPath, content + `\n${importMetaCode}`)
console.log(chalk.green.bold(`injected import.meta types`))

const tempDir = path.resolve(__dirname, '../temp/node')
const typesDir = path.resolve(__dirname, '../types')

// walk through the temp dts dir, find all import/export of types/*
// and rewrite them into relative imports - so that api-extractor actually
// includes them in the rolled-up final d.ts file.
walkDir(tempDir)
console.log(chalk.green.bold(`patched types/* imports`))

/**
 * @param {string} dir
 */
function walkDir(dir) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const resolved = path.resolve(dir, file)
    const isDir = fs.statSync(resolved).isDirectory()
    if (isDir) {
      walkDir(resolved)
    } else {
      rewriteFile(resolved)
    }
  }
}

/**
 * @param {string} file
 */
function rewriteFile(file) {
  const content = fs.readFileSync(file, 'utf-8')
  const str = new MagicString(content)
  const ast = parse(content, {
    sourceType: 'module',
    plugins: ['typescript', 'classProperties']
  })
  for (const statement of ast.program.body) {
    if (
      (statement.type === 'ImportDeclaration' ||
        statement.type === 'ExportNamedDeclaration' ||
        statement.type === 'ExportAllDeclaration') &&
      statement.source &&
      statement.source.value.startsWith('types/')
    ) {
      const source = statement.source
      const absoluteTypePath = path.resolve(typesDir, source.value.slice(6))
      const relativeTypePath = slash(
        path.relative(path.dirname(file), absoluteTypePath)
      )
      // @ts-ignore
      str.overwrite(source.start, source.end, JSON.stringify(relativeTypePath))
    }
  }
  fs.writeFileSync(file, str.toString())
}
