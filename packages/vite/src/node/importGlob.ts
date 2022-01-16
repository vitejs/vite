import path from 'path'
import { promises as fsp } from 'fs'
import glob from 'fast-glob'
import * as JSON5 from 'json5'
import {
  isModernFlag,
  preloadMethod,
  preloadMarker
} from './plugins/importAnalysisBuild'
import { cleanUrl } from './utils'
import type { RollupError } from 'rollup'

export interface AssertOptions {
  assert?: {
    type: string
  }
}

export async function transformImportGlob(
  source: string,
  pos: number,
  importer: string,
  importIndex: number,
  root: string,
  normalizeUrl?: (url: string, pos: number) => Promise<[string, string]>,
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

  let [pattern, assertion, endIndex] = lexGlobPattern(source, pos)
  if (!pattern.startsWith('.') && !pattern.startsWith('/')) {
    throw err(`pattern must start with "." or "/" (relative to project root)`)
  }
  let base: string
  let parentDepth = 0
  const isAbsolute = pattern.startsWith('/')
  if (isAbsolute) {
    base = path.resolve(root)
    pattern = pattern.slice(1)
  } else {
    base = path.dirname(importer)
    while (pattern.startsWith('../')) {
      pattern = pattern.slice(3)
      base = path.resolve(base, '../')
      parentDepth++
    }
    if (pattern.startsWith('./')) {
      pattern = pattern.slice(2)
    }
  }
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
    if (assertion?.assert?.type === 'raw') {
      entries += ` ${JSON.stringify(file)}: ${JSON.stringify(
        await fsp.readFile(path.join(base, file), 'utf-8')
      )},`
    } else if (isEager) {
      const identifier = `__glob_${importIndex}_${i}`
      importsString += `import ${
        isEagerDefault ? `` : `* as `
      }${identifier} from ${JSON.stringify(importee)};`
      entries += ` ${JSON.stringify(file)}: ${identifier},`
    } else {
      let imp = `import(${JSON.stringify(importee)})`
      if (!normalizeUrl && preload) {
        imp =
          `(${isModernFlag}` +
          `? ${preloadMethod}(()=>${imp},"${preloadMarker}")` +
          `: ${imp})`
      }
      entries += ` ${JSON.stringify(file)}: () => ${imp},`
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
): [string, AssertOptions, number] {
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

  const endIndex = getEndIndex(code, i)
  const options = code.substring(i + 1, endIndex)
  const commaIndex = options.indexOf(`,`)
  let assert = {}
  if (commaIndex > -1) {
    assert = JSON5.parse(options.substr(commaIndex + 1))
  }
  return [pattern, assert, endIndex + 1]
}

// reg without the 'g' option, only matches the first match
const multilineCommentsRE = /\/\*(.|[\r\n])*?\*\//m
const singlelineCommentsRE = /\/\/.*/

function getEndIndex(code: string, i: number): number {
  const findStart = i
  const endIndex = code.indexOf(`)`, findStart)
  const subCode = code.substring(findStart)

  const matched =
    subCode.match(singlelineCommentsRE) ?? subCode.match(multilineCommentsRE)
  if (!matched) {
    return endIndex
  }

  const str = matched[0]
  const index = matched.index
  if (!index) {
    return endIndex
  }

  const commentStart = findStart + index
  const commentEnd = commentStart + str.length
  if (endIndex > commentStart && endIndex < commentEnd) {
    return getEndIndex(code, commentEnd)
  } else {
    return endIndex
  }
}

function error(pos: number) {
  const err = new Error(
    `import.meta.glob() can only accept string literals.`
  ) as RollupError
  err.pos = pos
  throw err
}
