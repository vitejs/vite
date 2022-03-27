import path from 'path'
import { promises as fsp } from 'fs'
import glob from 'fast-glob'
import JSON5 from 'json5'
import {
  isModernFlag,
  preloadMethod,
  preloadMarker
} from './plugins/importAnalysisBuild'
import { isCSSRequest } from './plugins/css'
import {
  cleanUrl,
  singlelineCommentsRE,
  multilineCommentsRE,
  blankReplacer,
  normalizePath
} from './utils'
import type { RollupError } from 'rollup'
import type { Logger } from '.'
import colors from 'picocolors'

interface GlobParams {
  base: string
  pattern: string
  parentDepth: number
  isAbsolute: boolean
}

interface GlobOptions {
  as?: string
  /**
   * @deprecated
   */
  assert?: {
    type: string
  }
}

function formatGlobRelativePattern(base: string, pattern: string): GlobParams {
  let parentDepth = 0
  while (pattern.startsWith('../')) {
    pattern = pattern.slice(3)
    base = path.resolve(base, '../')
    parentDepth++
  }
  if (pattern.startsWith('./')) {
    pattern = pattern.slice(2)
  }

  return { base, pattern, parentDepth, isAbsolute: false }
}

export async function transformImportGlob(
  source: string,
  pos: number,
  importer: string,
  importIndex: number,
  root: string,
  logger: Logger,
  normalizeUrl?: (url: string, pos: number) => Promise<[string, string]>,
  resolve?: (url: string, importer?: string) => Promise<string | undefined>,
  preload = true
): Promise<{
  importsString: string
  imports: string[]
  exp: string
  endIndex: number
  isEager: boolean
  pattern: string
  base: string
}> {
  const isEager = source.slice(pos, pos + 21) === 'import.meta.globEager'
  const isEagerDefault =
    isEager && source.slice(pos + 21, pos + 28) === 'Default'

  const err = (msg: string) => {
    const e = new Error(`Invalid glob import syntax: ${msg}`)
    ;(e as any).pos = pos
    return e
  }

  importer = cleanUrl(importer)
  const importerBasename = path.basename(importer)

  const [userPattern, options, endIndex] = lexGlobPattern(source, pos)

  let globParams: GlobParams | null = null
  if (userPattern.startsWith('/')) {
    globParams = {
      isAbsolute: true,
      base: path.resolve(root),
      pattern: userPattern.slice(1),
      parentDepth: 0
    }
  } else if (userPattern.startsWith('.')) {
    globParams = formatGlobRelativePattern(path.dirname(importer), userPattern)
  } else if (resolve) {
    const resolvedId = await resolve(userPattern, importer)
    if (resolvedId) {
      const importerDirname = path.dirname(importer)
      globParams = formatGlobRelativePattern(
        importerDirname,
        normalizePath(path.relative(importerDirname, resolvedId))
      )
    }
  }

  if (!globParams) {
    throw err(
      `pattern must start with "." or "/" (relative to project root) or alias path`
    )
  }
  const { base, parentDepth, isAbsolute, pattern } = globParams

  const files = glob.sync(pattern, {
    cwd: base,
    // Ignore node_modules by default unless explicitly indicated in the pattern
    ignore: /(^|\/)node_modules\//.test(pattern) ? [] : ['**/node_modules/**']
  })
  const imports: string[] = []
  let importsString = ``
  let entries = ``
  for (let i = 0; i < files.length; i++) {
    // skip importer itself
    if (files[i] === importerBasename) continue
    const file = isAbsolute
      ? `/${files[i]}`
      : parentDepth
      ? `${'../'.repeat(parentDepth)}${files[i]}`
      : `./${files[i]}`
    let importee = file
    if (normalizeUrl) {
      ;[importee] = await normalizeUrl(file, pos)
    }
    imports.push(importee)
    // TODO remove assert syntax for the Vite 3.0 release.
    const isRawAssert = options?.assert?.type === 'raw'
    const isRawType = options?.as === 'raw'
    if (isRawType || isRawAssert) {
      if (isRawAssert) {
        logger.warn(
          colors.yellow(
            colors.bold(
              "(!) import.meta.glob('...', { assert: { type: 'raw' }}) is deprecated. Use import.meta.glob('...', { as: 'raw' }) instead."
            )
          )
        )
      }
      entries += ` ${JSON.stringify(file)}: ${JSON.stringify(
        await fsp.readFile(path.join(base, file), 'utf-8')
      )},`
    } else {
      const importeeUrl = isCSSRequest(importee) ? `${importee}?used` : importee
      if (isEager) {
        const identifier = `__glob_${importIndex}_${i}`
        // css imports injecting a ?used query to export the css string
        importsString += `import ${
          isEagerDefault ? `` : `* as `
        }${identifier} from ${JSON.stringify(importeeUrl)};`
        entries += ` ${JSON.stringify(file)}: ${identifier},`
      } else {
        let imp = `import(${JSON.stringify(importeeUrl)})`
        if (!normalizeUrl && preload) {
          imp =
            `(${isModernFlag}` +
            `? ${preloadMethod}(()=>${imp},"${preloadMarker}")` +
            `: ${imp})`
        }
        entries += ` ${JSON.stringify(file)}: () => ${imp},`
      }
    }
  }

  return {
    imports,
    importsString,
    exp: `{${entries}}`,
    endIndex,
    isEager,
    pattern,
    base
  }
}

const enum LexerState {
  inCall,
  inSingleQuoteString,
  inDoubleQuoteString,
  inTemplateString
}

function lexGlobPattern(
  code: string,
  pos: number
): [string, GlobOptions, number] {
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
  const noCommentCode = code
    .slice(i + 1)
    .replace(singlelineCommentsRE, blankReplacer)
    .replace(multilineCommentsRE, blankReplacer)

  const endIndex = noCommentCode.indexOf(')')
  const optionString = noCommentCode.substring(0, endIndex)
  const commaIndex = optionString.indexOf(',')

  let options = {}
  if (commaIndex > -1) {
    options = JSON5.parse(optionString.substring(commaIndex + 1))
  }
  return [pattern, options, endIndex + i + 2]
}

function error(pos: number) {
  const err = new Error(
    `import.meta.glob() can only accept string literals.`
  ) as RollupError
  err.pos = pos
  throw err
}
