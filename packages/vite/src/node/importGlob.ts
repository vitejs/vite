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
  normalizePath,
  parseRequest
} from './utils'
import type { RollupError } from 'rollup'
import type { Logger } from '.'
import colors from 'picocolors'
import { dynamicImportToGlob } from '@rollup/plugin-dynamic-import-vars'
import { parse as parseJS } from 'acorn'

interface GlobParams {
  base: string
  pattern: string
  parentDepth: number
  isAbsolute: boolean
}

interface GlobOptions {
  as?: string
}

interface DynamicImportRequest {
  raw?: boolean
}

interface DynamicImportPattern {
  query: DynamicImportRequest
  userPattern: string
  rawPattern: string
}

export function parseDynamicImportPattern(
  strings: string
): DynamicImportPattern | null {
  const filename = strings.slice(1, -1)
  const rawQuery = parseRequest(filename)
  const query: DynamicImportRequest = {}
  const ast = (
    parseJS(strings, {
      ecmaVersion: 'latest',
      sourceType: 'module'
    }) as any
  ).body[0].expression

  const userPatternQuery = dynamicImportToGlob(ast, filename)
  if (!userPatternQuery) {
    return null
  }

  const [userPattern] = userPatternQuery.split('?', 2)
  const [rawPattern] = filename.split('?', 2)

  if (rawQuery?.raw !== undefined) {
    query.raw = true
  }

  return {
    query,
    userPattern,
    rawPattern
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

export async function transformGlob(
  source: string,
  pos: number,
  importer: string,
  importIndex: number,
  importEndIndex: number,
  query: DynamicImportRequest,
  userPattern: string,
  root: string,
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
  importer = cleanUrl(importer)
  const importerBasename = path.basename(importer)

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
    throw `pattern must start with "." or "/" (relative to project root) or alias path`
  }
  const { base, parentDepth, isAbsolute, pattern } = globParams

  const files = glob.sync(pattern, {
    cwd: base,
    // Ignore node_modules by default unless explicitly indicated in the pattern
    ignore: /(^|\/)node_modules\//.test(pattern) ? [] : ['**/node_modules/**']
  })

  const isEager = source.slice(pos, pos + 21) === 'import.meta.globEager'
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
    if (query.raw) {
      entries += ` ${JSON.stringify(file)}: ${JSON.stringify(
        await fsp.readFile(path.join(base, files[i]), 'utf-8')
      )},`
    } else {
      const isEagerDefault =
        isEager && source.slice(pos + 21, pos + 28) === 'Default'
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
    endIndex: importEndIndex,
    isEager,
    pattern,
    base
  }
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
  const err = (msg: string) => {
    const e = new Error(`Invalid glob import syntax: ${msg}`)
    ;(e as any).pos = pos
    return e
  }
  const [userPattern, options, endIndex] = lexGlobPattern(source, pos)
  const query: DynamicImportRequest = {}

  const isRawType = options?.as === 'raw'
  if (isRawType) {
    query.raw = true
  }
  try {
    return transformGlob(
      source,
      pos,
      importer,
      importIndex,
      endIndex,
      query,
      userPattern,
      root,
      normalizeUrl,
      resolve,
      preload
    )
  } catch (error) {
    throw err(error)
  }
}

export async function transformDynamicImportGlob(
  source: string,
  expStart: number,
  expEnd: number,
  importer: string,
  start: number,
  end: number,
  root: string,
  normalizeUrl?: (url: string, pos: number) => Promise<[string, string]>,
  resolve?: (url: string, importer?: string) => Promise<string | undefined>,
  preload = false
): Promise<{
  importsString: string
  imports: string[]
  exp: string
  endIndex: number
  isEager: boolean
  pattern: string
  rawPattern: string
  base: string
} | null> {
  const err = (msg: string) => {
    const e = new Error(`Invalid dynamic import syntax: ${msg}`)
    ;(e as any).pos = start
    return e
  }
  let fileName = source.slice(start, end)

  if (fileName[1] !== '.' && fileName[1] !== '/' && resolve) {
    const resolvedFileName = await resolve(fileName.slice(1, -1), importer)
    if (!resolvedFileName) {
      return null
    }
    const relativeFileName = path.posix.relative(
      path.dirname(importer),
      resolvedFileName
    )
    fileName = `\`${relativeFileName}\``
  }

  const dynamicImportPattern = parseDynamicImportPattern(fileName)
  if (!dynamicImportPattern) {
    return null
  }
  const { query, rawPattern, userPattern } = dynamicImportPattern

  try {
    return {
      rawPattern,
      ...(await transformGlob(
        source,
        start,
        importer,
        expStart,
        expEnd,
        query,
        userPattern,
        root,
        normalizeUrl,
        resolve,
        preload
      ))
    }
  } catch (error) {
    throw err(error)
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
