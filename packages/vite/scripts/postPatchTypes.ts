import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import colors from 'picocolors'
import { rewriteImports, walkDir } from './util'

const dir = dirname(fileURLToPath(import.meta.url))
const nodeDts = resolve(dir, '../dist/node/index.d.ts')

// rewrite `types/*` import to relative import with file extension
rewriteImports(nodeDts, (importPath) => {
  if (importPath.startsWith('types/')) {
    return (
      '../../' + (importPath.endsWith('.js') ? importPath : importPath + '.js')
    )
  }
})

console.log(colors.green(colors.bold(`patched types/* imports`)))

// remove picomatch type import because only the internal property uses it
const picomatchImport = "import type { Matcher as Matcher_2 } from 'picomatch';"

walkDir(nodeDts, (file) => {
  const content = fs.readFileSync(file, 'utf-8')
  if (!content.includes(picomatchImport)) {
    throw new Error(`Should find picomatch type import in ${file}`)
  }

  const replacedContent = content.replace(picomatchImport, '')
  fs.writeFileSync(file, replacedContent, 'utf-8')
})

console.log(colors.green(colors.bold(`removed picomatch type import`)))
