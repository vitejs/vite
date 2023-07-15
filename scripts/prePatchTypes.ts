import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import colors from 'picocolors'
import { rewriteImports, slash } from './util'

const dir = dirname(fileURLToPath(import.meta.url))
const tempDir = resolve(dir, '../temp/node')
const depTypesDir = resolve(dir, '../src/types')

// walk through the temp dts dir, find all import/export of, deps-types/*
// and rewrite them into relative imports - so that api-extractor actually
// includes them in the rolled-up final d.ts file.
rewriteImports(tempDir, (importPath, currentFile) => {
  if (importPath.startsWith('dep-types/')) {
    const absoluteTypePath = resolve(
      depTypesDir,
      importPath.slice('dep-types/'.length),
    )
    return slash(relative(dirname(currentFile), absoluteTypePath))
  }
})

console.log(colors.green(colors.bold(`patched deps-types/* imports`)))
