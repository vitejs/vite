/**
 * Checks whether the built files depend on devDependencies types.
 * We shouldn't depend on them.
 */
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import colors from 'picocolors'
import type { ParseResult } from '@babel/parser'
import type { File, SourceLocation } from '@babel/types'
import { parse } from '@babel/parser'
import { walkDir } from './util'

const dir = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(dir, '../dist')

const pkgJson = JSON.parse(
  readFileSync(resolve(dir, '../package.json'), 'utf-8'),
)
const deps = new Set(
  Object.keys(Object.assign(pkgJson.dependencies, pkgJson.peerDependencies)),
)

type SpecifierError = {
  loc: SourceLocation | null | undefined
  value: string
  file: string
}

const errors: SpecifierError[] = []
walkDir(distDir, (file) => {
  if (!file.endsWith('.d.ts')) return

  const specifiers = collectImportSpecifiers(file)
  const notAllowedSpecifiers = specifiers.filter(
    ({ value }) =>
      !(
        value.startsWith('./') ||
        value.startsWith('../') ||
        value.startsWith('node:') ||
        deps.has(value)
      ),
  )

  errors.push(...notAllowedSpecifiers)
})

if (errors.length <= 0) {
  console.log(colors.green(colors.bold(`passed built types check`)))
} else {
  console.log(colors.red(colors.bold(`failed built types check`)))
  console.log()
  errors.forEach((error) => {
    const pos = error.loc
      ? `${colors.yellow(error.loc.start.line)}:${colors.yellow(
          error.loc.start.column,
        )}`
      : ''
    console.log(
      `${colors.cyan(error.file)}:${pos} - importing from ${colors.bold(
        JSON.stringify(error.value),
      )} is not allowed in built files`,
    )
  })

  process.exit(1)
}

function collectImportSpecifiers(file: string) {
  const content = readFileSync(file, 'utf-8')

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

  const result: SpecifierError[] = []

  for (const statement of ast.program.body) {
    if (
      statement.type === 'ImportDeclaration' ||
      statement.type === 'ExportNamedDeclaration' ||
      statement.type === 'ExportAllDeclaration'
    ) {
      const source = statement.source
      if (source?.value) {
        result.push({
          loc: source.loc,
          value: source.value,
          file,
        })
      }
    }
  }

  return result
}
