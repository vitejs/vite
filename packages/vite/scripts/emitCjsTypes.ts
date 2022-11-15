import fs from 'node:fs'
import path from 'node:path'
import glob from 'fast-glob'
import * as lexer from 'es-module-lexer'
import colors from 'picocolors'

async function main() {
  const typeFiles = await glob('**/*.d.ts', {
    cwd: 'dist',
    absolute: true
  })

  for (const file of typeFiles) {
    let text = fs.readFileSync(file, 'utf8')

    const [imports] = lexer.parse(text)
    const typeImports = parseTypeImports(text, true)
    const allImports = [...imports, ...typeImports]
      // In reverse order
      .sort((a, b) => b.s - a.s)

    for (const i of allImports) {
      let id = i.n
      if (!id || !/^\.\.?(?:\/|$)/.test(id) || id.endsWith('.cjs')) {
        continue
      }

      const importedFile = path.resolve(path.dirname(file), id)
      if (isDirectory(importedFile)) {
        id += '/index'
      }

      const cjsModuleSpec = id + '.cjs'
      text = text.slice(0, i.s) + cjsModuleSpec + text.slice(i.e)
    }

    const outFile = file
      .replace('/node/', '/node-cjs/')
      .replace(/\.ts$/, '.cts')

    fs.mkdirSync(path.dirname(outFile), { recursive: true })
    fs.writeFileSync(outFile, text)
  }

  console.log(colors.green(colors.bold(`emitted CJS types`)))
}

function isDirectory(file: string) {
  try {
    return fs.statSync(file).isDirectory()
  } catch (e) {
    return false
  }
}

// This assumes no each import/export statement is on its own line.
function parseTypeImports(code: string, exportsOnly?: boolean) {
  const imports = []

  const openKeywords = exportsOnly ? ['export'] : ['import', 'export']
  const openPattern = [['', '\n'], openKeywords, ['type']]
  const fromPattern = [['from'], ['"', "'"]]

  let cursor = 0
  let pattern = openPattern
  let patternIndex = 0

  const words = code.split(/([\w/\-@.]+|\n)/g)
  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/ /g, '')
    if (pattern[patternIndex].includes(word)) {
      if (++patternIndex === pattern.length) {
        patternIndex = 0
        if (pattern === openPattern) {
          pattern = fromPattern
        } else if (pattern === fromPattern) {
          pattern = openPattern
          const moduleSpecifier = words[i + 1]
          const start = cursor + words[i].length
          imports.push({
            s: start,
            e: start + moduleSpecifier.length,
            n: moduleSpecifier
          })
        }
      }
    } else if (patternIndex > 0 && word) {
      patternIndex = 0
    }
    cursor += words[i].length
  }

  return imports
}

main()
