import path from 'path'
import glob from 'fast-glob'
import { ResolvedConfig } from '../config'
import { Plugin } from '../plugin'
import { cleanUrl } from '../utils'
import MagicString from 'magic-string'
import { ImportSpecifier, init, parse as parseImports } from 'es-module-lexer'
import { RollupError } from 'rollup'

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
        source.indexOf('import.meta.glob') < 0
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
        const { s: start, e: end, ss: expStart } = imports[index]
        const url = source.slice(start, end)
        if (url === 'import.meta' && source.slice(end, end + 5) === '.glob') {
          const { imports, exp, endIndex } = await transformImportGlob(
            source,
            start,
            importer,
            index
          )
          str().prepend(imports)
          str().overwrite(expStart, endIndex, exp)
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
  source: string,
  pos: number,
  importer: string,
  importIndex: number,
  normalizeUrl?: (url: string, pos: number) => Promise<[string, string]>
): Promise<{ imports: string; exp: string; endIndex: number }> {
  const err = (msg: string) => {
    const e = new Error(`Invalid glob import syntax: ${msg}`)
    ;(e as any).pos = pos
    return e
  }

  importer = cleanUrl(importer)
  const importerBasename = path.basename(importer)

  let [pattern, endIndex] = lexGlobPattern(source, pos)
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
    const isEager = source.slice(pos, pos + 21) === 'import.meta.globEager'
    if (isEager) {
      imports += `import * as ${identifier} from ${JSON.stringify(importee)};`
      entries += ` ${JSON.stringify(file)}: ${identifier},`
    } else {
      entries += ` ${JSON.stringify(file)}: () => import(${JSON.stringify(
        importee
      )}),`
    }
  }

  return {
    imports,
    exp: `{${entries}}`,
    endIndex
  }
}

const enum LexerState {
  inCall,
  inSingleQuoteString,
  inDoubleQuoteString,
  inTemplateString
}

function lexGlobPattern(code: string, pos: number): [string, number] {
  let state = LexerState.inCall
  let pattern = ''

  let i = code.indexOf(`(`, pos) + 1
  outer: for (; i < code.length; i++) {
    const char = code.charAt(i)
    switch (state) {
      case LexerState.inCall:
        if (char === `'`) {
          state = LexerState.inSingleQuoteString
        } else if (char === `"`) {
          state = LexerState.inDoubleQuoteString
        } else if (char === '`') {
          state = LexerState.inTemplateString
        } else if (/\s/.test(char)) {
          continue
        } else {
          error(i)
        }
        break
      case LexerState.inSingleQuoteString:
        if (char === `'`) {
          break outer
        } else {
          pattern += char
        }
        break
      case LexerState.inDoubleQuoteString:
        if (char === `"`) {
          break outer
        } else {
          pattern += char
        }
        break
      case LexerState.inTemplateString:
        if (char === '`') {
          break outer
        } else {
          pattern += char
        }
        break
      default:
        throw new Error('unknown import.meta.glob lexer state')
    }
  }
  return [pattern, code.indexOf(`)`, i) + 1]
}

function error(pos: number) {
  const err = new Error(
    `import.meta.glob() can only accept string literals.`
  ) as RollupError
  err.pos = pos
  throw err
}
