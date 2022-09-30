import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import colors from 'picocolors'
import { rewriteImports } from './util'

const dir = dirname(fileURLToPath(import.meta.url))
const nodeDts = resolve(dir, '../dist/node/index.d.ts')

// rewrite `types/*` import to relative import
rewriteImports(nodeDts, (importPath) => {
  if (importPath.startsWith('types/')) {
    return '../../' + importPath
  }
})

console.log(colors.green(colors.bold(`patched types/* imports`)))
