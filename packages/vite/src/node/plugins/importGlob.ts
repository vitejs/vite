import path from 'path'
import glob from 'fast-glob'
import { ResolvedConfig } from '../config'
import { Plugin } from '../plugin'
import { parse as parseJS } from 'acorn'
import { cleanUrl } from '../utils'
import type { Node } from 'estree'
import MagicString from 'magic-string'
import { ImportSpecifier, init, parse as parseImports } from 'es-module-lexer'

/**
 * Build only. During serve this is performed as part of ./importAnalysis.
 */
export function importGlobPlugin(config: ResolvedConfig): Plugin {
  return {
    name: 'vite:import-glob',

    async transform(source, importer) {
      if (
        // skip deps
        importer.includes('node_modules') ||
        // fast check for presence of glob keyword
        source.indexOf('glob:.') < 0
      ) {
        return
      }

      await init

      let imports: ImportSpecifier[] = []
      try {
        imports = parseImports(source)[0]
      } catch (e) {
        this.error(e, e.idx)
      }

      if (!imports.length) {
        return null
      }

      let s: MagicString | undefined
      const str = () => s || (s = new MagicString(source))

      for (let index = 0; index < imports.length; index++) {
        const { s: start, e: end, ss: expStart, se: expEnd } = imports[index]
        const url = source.slice(start, end)
        if (url.startsWith('glob:')) {
          const result = await transformImportGlob(
            source.slice(expStart, expEnd),
            url,
            importer,
            index,
            start
          )
          str().overwrite(expStart, expEnd, result)
        }
      }

      if (s) {
        return {
          code: s.toString(),
          map: config.build.sourcemap ? s.generateMap({ hires: true }) : null
        }
      }
    }
  }
}

export async function transformImportGlob(
  exp: string,
  url: string,
  importer: string,
  importIndex: number,
  pos: number,
  normalizeUrl?: (url: string, pos: number) => Promise<[string, string]>
): Promise<string> {
  const err = (msg: string) => {
    const e = new Error(`Invalid glob import syntax: ${msg}`)
    ;(e as any).pos = pos
    return e
  }

  const node = (parseJS(exp, {
    ecmaVersion: 2020,
    sourceType: 'module'
  }) as any).body[0] as Node

  if (node.type !== 'ImportDeclaration') {
    throw err(`statement must be an import declaration.`)
  }

  let localName: string | undefined
  for (const spec of node.specifiers) {
    if (spec.type !== 'ImportDefaultSpecifier') {
      throw err(`can only use the default import.`)
    }
    localName = spec.local.name
    break
  }
  if (!localName) {
    throw err(`missing default import.`)
  }

  importer = cleanUrl(importer)
  const importerBasename = path.basename(importer)

  let pattern = url.slice(5)
  if (!pattern.startsWith('.')) {
    throw err(`pattern must start with "."`)
  }
  let base = path.dirname(importer)
  let parentDepth = 0
  while (pattern.startsWith('../')) {
    pattern = pattern.slice(3)
    base = path.resolve(base, '../')
    parentDepth++
  }
  if (pattern.startsWith('./')) {
    pattern = pattern.slice(2)
  }

  const files = glob.sync(pattern, { cwd: base })
  let imports = ``
  let entries = ``
  for (let i = 0; i < files.length; i++) {
    // skip importer itself
    if (files[i] === importerBasename) continue
    const file = parentDepth
      ? `${'../'.repeat(parentDepth)}${files[i]}`
      : `./${files[i]}`
    let importee = file
    if (normalizeUrl) {
      ;[importee] = await normalizeUrl(file, pos)
    }
    const identifier = `__glob_${importIndex}_${i}`
    imports += `import * as ${identifier} from "${importee}";\n`
    entries += `\n  ${JSON.stringify(file)}: ${identifier},`
  }

  return `${imports}const ${localName} = {${entries}\n}`
}
