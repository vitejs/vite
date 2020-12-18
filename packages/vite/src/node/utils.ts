import debug from 'debug'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import slash from 'slash'
import { FILE_PREFIX } from './constants'

// set in bin/vite.js
const filter = process.env.VITE_DEBUG_FILTER

const DEBUG = process.env.DEBUG

interface DebuggerOptions {
  onlyWhenFocused?: boolean | string
}

export function createDebugger(ns: string, options: DebuggerOptions = {}) {
  const log = debug(ns)
  const { onlyWhenFocused } = options
  const focus = typeof onlyWhenFocused === 'string' ? onlyWhenFocused : ns
  return (msg: string, ...args: any[]) => {
    if (filter && !msg.includes(filter)) {
      return
    }
    if (onlyWhenFocused && !DEBUG?.includes(focus)) {
      return
    }
    log(msg, ...args)
  }
}

export const queryRE = /\?.*$/
export const hashRE = /#.*$/

export const cleanUrl = (url: string) =>
  url.replace(hashRE, '').replace(queryRE, '')

const externalRE = /^(https?:)?\/\//
export const isExternalUrl = (url: string) => externalRE.test(url)

const knownJsSrcRE = /\.((j|t)sx?|mjs|vue)($|\?)/
export const isJSRequest = (url: string) => knownJsSrcRE.test(url)

const importQueryRE = /(\?|&)import(&|$)/
export const isImportRequest = (url: string) => importQueryRE.test(url)

export function removeImportQuery(url: string) {
  return url.replace(importQueryRE, '$1').replace(/\?$/, '')
}

export function injectQuery(url: string, queryToInject: string) {
  const [pathname, query] = url.split(`?`, 2)
  return `${pathname}?${queryToInject}${query ? `&${query}` : ``}`
}

export function removeTimestampQuery(url: string) {
  return url.replace(/\bt=\d{13}&?\b/, '').replace(/\?$/, '')
}

export async function asyncReplace(
  input: string,
  re: RegExp,
  replacer: (match: RegExpExecArray) => string | Promise<string>
) {
  let match: RegExpExecArray | null
  let remaining = input
  let rewritten = ''
  while ((match = re.exec(remaining))) {
    rewritten += remaining.slice(0, match.index)
    rewritten += await replacer(match)
    remaining = remaining.slice(match.index + match[0].length)
  }
  rewritten += remaining
  return rewritten
}

export function timeFrom(start: number, subtract = 0) {
  const time: number | string = Date.now() - start - subtract
  const timeString = (time + `ms`).padEnd(5, ' ')
  if (time < 10) {
    return chalk.green(timeString)
  } else if (time < 50) {
    return chalk.yellow(timeString)
  } else {
    return chalk.red(timeString)
  }
}

/**
 * pretty url for logging.
 */
export function prettifyUrl(url: string, root: string) {
  url = removeTimestampQuery(url)
  const isAbsoluteFile = url.startsWith(slash(root))
  if (isAbsoluteFile || url.startsWith(FILE_PREFIX)) {
    let file = path.relative(
      root,
      isAbsoluteFile ? url : url.slice(FILE_PREFIX.length)
    )
    const seg = file.split('/')
    const npmIndex = seg.indexOf(`node_modules`)
    const isSourceMap = file.endsWith('.map')
    if (npmIndex > 0) {
      file = seg[npmIndex + 1]
      if (file.startsWith('@')) {
        file = `${file}/${seg[npmIndex + 2]}`
      }
      file = `npm: ${chalk.dim(file)}${isSourceMap ? ` (source map)` : ``}`
    }
    return chalk.dim(file)
  } else {
    return chalk.dim(url)
  }
}

export function deepMerge(
  a: Record<string, any>,
  b: Record<string, any>
): Record<string, any> {
  const merged: Record<string, any> = { ...a }
  for (const key in b) {
    const value = b[key]
    const existing = merged[key]
    if (Array.isArray(existing) && Array.isArray(value)) {
      merged[key] = [...existing, ...value]
      continue
    }
    if (isObject(existing) && isObject(value)) {
      merged[key] = { ...existing, ...value }
      continue
    }
    merged[key] = value
  }
  return merged
}

export function isObject(value: unknown): value is object {
  return Object.prototype.toString.call(value) === '[object Object]'
}

export function lookupFile(
  dir: string,
  formats: string[],
  pathOnly = false
): string | undefined {
  for (const format of formats) {
    const fullPath = path.join(dir, format)
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return pathOnly ? fullPath : fs.readFileSync(fullPath, 'utf-8')
    }
  }
  const parentDir = path.dirname(dir)
  if (parentDir !== dir) {
    return lookupFile(parentDir, formats, pathOnly)
  }
}

const splitRE = /\r?\n/

const range: number = 2

export function pad(source: string, n = 2) {
  const lines = source.split(splitRE)
  return lines.map((l) => ` `.repeat(n) + l).join(`\n`)
}

export function posToNumber(
  source: string,
  pos: number | { line: number; column: number }
): number {
  if (typeof pos === 'number') return pos
  const lines = source.split(splitRE)
  const { line, column } = pos
  let start = 0
  for (let i = 0; i < line; i++) {
    start += lines[i].length
  }
  return start + column - 1
}

export function numberToPos(
  source: string,
  offset: number | { line: number; column: number }
) {
  if (typeof offset !== 'number') return offset
  if (offset > source.length) {
    throw new Error('offset is longer than source length!')
  }
  const lines = source.split(splitRE)
  let counted = 0
  let line = 0
  let column = 0
  for (; line < lines.length; line++) {
    const lineLength = lines[line].length + 1
    if (counted + lineLength >= offset) {
      column = offset - counted + 1
      break
    }
    counted += lineLength
  }
  return { line: line + 1, column }
}

export function generateCodeFrame(
  source: string,
  start: number | { line: number; column: number } = 0,
  end?: number
): string {
  start = posToNumber(source, start)
  end = end || start
  const lines = source.split(splitRE)
  let count = 0
  const res: string[] = []
  for (let i = 0; i < lines.length; i++) {
    count += lines[i].length + 1
    if (count >= start) {
      for (let j = i - range; j <= i + range || end > count; j++) {
        if (j < 0 || j >= lines.length) continue
        const line = j + 1
        res.push(
          `${line}${' '.repeat(Math.max(3 - String(line).length, 0))}|  ${
            lines[j]
          }`
        )
        const lineLength = lines[j].length
        if (j === i) {
          // push underline
          const pad = start - (count - lineLength) + 1
          const length = Math.max(
            1,
            end > count ? lineLength - pad : end - start
          )
          res.push(`   |  ` + ' '.repeat(pad) + '^'.repeat(length))
        } else if (j > i) {
          if (end > count) {
            const length = Math.max(Math.min(end - count, lineLength), 1)
            res.push(`   |  ` + '^'.repeat(length))
          }
          count += lineLength + 1
        }
      }
      break
    }
  }
  return res.join('\n')
}
