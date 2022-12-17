import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ParseResult } from '@babel/parser'
import { parse } from '@babel/parser'
import type { File } from '@babel/types'
import colors from 'picocolors'
import MagicString from 'magic-string'

export function rewriteImports(
  fileOrDir: string,
  rewrite: (importPath: string, currentFile: string) => string | void,
): void {
  walkDir(fileOrDir, (file) => {
    rewriteFileImports(file, (importPath) => {
      return rewrite(importPath, file)
    })
  })
}

export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

export function walkDir(dir: string, handleFile: (file: string) => void): void {
  if (statSync(dir).isDirectory()) {
    const files = readdirSync(dir)
    for (const file of files) {
      const resolved = resolve(dir, file)
      walkDir(resolved, handleFile)
    }
  } else {
    handleFile(dir)
  }
}

function rewriteFileImports(
  file: string,
  rewrite: (importPath: string) => string | void,
): void {
  const content = readFileSync(file, 'utf-8')
  const str = new MagicString(content)
  let ast: ParseResult<File>
  try {
    ast = parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'classProperties'],
    })
  } catch (e) {
    console.log(colors.red(`failed to parse ${file}`))
    throw e
  }
  for (const statement of ast.program.body) {
    if (
      statement.type === 'ImportDeclaration' ||
      statement.type === 'ExportNamedDeclaration' ||
      statement.type === 'ExportAllDeclaration'
    ) {
      const source = statement.source
      if (source?.value) {
        const newImportPath = rewrite(source.value)
        if (newImportPath) {
          str.overwrite(
            source.start!,
            source.end!,
            JSON.stringify(newImportPath),
          )
        }
      }
    }
  }
  writeFileSync(file, str.toString())
}
