import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs'
import { dirname, relative, resolve } from 'path'
import { fileURLToPath } from 'url'
import type { ParseResult } from '@babel/parser'
import { parse } from '@babel/parser'
import type { File } from '@babel/types'
import colors from 'picocolors'
import MagicString from 'magic-string'

const dir = dirname(fileURLToPath(import.meta.url))
const tempDir = resolve(dir, '../temp/node')
const typesDir = resolve(dir, '../types')

// walk through the temp dts dir, find all import/export of types/*
// and rewrite them into relative imports - so that api-extractor actually
// includes them in the rolled-up final d.ts file.
walkDir(tempDir)
console.log(colors.green(colors.bold(`patched types/* imports`)))

function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

function walkDir(dir: string): void {
  const files = readdirSync(dir)
  for (const file of files) {
    const resolved = resolve(dir, file)
    const isDir = statSync(resolved).isDirectory()
    if (isDir) {
      walkDir(resolved)
    } else {
      rewriteFile(resolved)
    }
  }
}

function rewriteFile(file: string): void {
  const content = readFileSync(file, 'utf-8')
  const str = new MagicString(content)
  let ast: ParseResult<File>
  try {
    ast = parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'classProperties']
    })
  } catch (e) {
    console.log(colors.red(`failed to parse ${file}`))
    throw e
  }
  for (const statement of ast.program.body) {
    if (
      (statement.type === 'ImportDeclaration' ||
        statement.type === 'ExportNamedDeclaration' ||
        statement.type === 'ExportAllDeclaration') &&
      statement.source?.value.startsWith('types/')
    ) {
      const source = statement.source
      const absoluteTypePath = resolve(typesDir, source.value.slice(6))
      const relativeTypePath = slash(relative(dirname(file), absoluteTypePath))
      str.overwrite(
        source.start!,
        source.end!,
        JSON.stringify(relativeTypePath)
      )
    }
  }
  writeFileSync(file, str.toString())
}
