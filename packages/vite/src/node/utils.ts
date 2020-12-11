import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import slash from 'slash'
import { FILE_PREFIX } from './plugins/resolve'

export const queryRE = /\?.*$/
export const hashRE = /#.*$/

export const cleanUrl = (url: string) =>
  url.replace(hashRE, '').replace(queryRE, '')

const externalRE = /^(https?:)?\/\//
export const isExternalUrl = (url: string) => externalRE.test(url)

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

export function removeTimestampQuery(url: string) {
  return url.replace(/\bt=\d{13}&?\b/, '').replace(/\?$/, '')
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
    if (npmIndex > 0) {
      file = seg[npmIndex + 1]
      if (file.startsWith('@')) {
        file = `${file}/${seg[npmIndex + 2]}`
      }
      file = `npm: ${chalk.dim(file)}`
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

const range: number = 2

export function generateCodeFrame(
  source: string,
  start = 0,
  end = source.length
): string {
  const lines = source.split(/\r?\n/)
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
