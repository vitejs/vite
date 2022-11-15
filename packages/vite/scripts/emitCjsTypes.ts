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
    for (const i of [...imports].reverse()) {
      let id = i.n
      if (!id || !/^\.\.?(?:\/|$)/.test(id)) {
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

main()
