import fs from 'fs'
import os from 'os'
import path from 'path'
import { createHash } from 'crypto'
import { promisify } from 'util'
import { URL, URLSearchParams, pathToFileURL } from 'url'
import { builtinModules, createRequire } from 'module'
import { performance } from 'perf_hooks'
import resolve from 'resolve'
import type { FSWatcher } from 'chokidar'
import remapping from '@ampproject/remapping'
import type { DecodedSourceMap, RawSourceMap } from '@ampproject/remapping'
import colors from 'picocolors'
import debug from 'debug'
import type { Alias, AliasOptions } from 'types/alias'
import type MagicString from 'magic-string'

import type { TransformResult } from 'rollup'
import {
  CLIENT_ENTRY,
  CLIENT_PUBLIC_PATH,
  DEFAULT_EXTENSIONS,
  ENV_PUBLIC_PATH,
  FS_PREFIX,
  VALID_ID_PREFIX
} from './constants'
import type { ResolvedConfig } from '.'

export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

// Strip valid id prefix. This is prepended to resolved Ids that are
// not valid browser import specifiers by the importAnalysis plugin.
export function unwrapId(id: string): string {
  return id.startsWith(VALID_ID_PREFIX) ? id.slice(VALID_ID_PREFIX.length) : id
}

export const flattenId = (id: string): string =>
  id.replace(/(\s*>\s*)/g, '__').replace(/[\/\.:]/g, '_')

export const normalizeId = (id: string): string =>
  id.replace(/(\s*>\s*)/g, ' > ')

//TODO: revisit later to see if the edge case that "compiling using node v12 code to be run in node v16 in the server" is what we intend to support.
const builtins = new Set([
  ...builtinModules,
  'assert/strict',
  'diagnostics_channel',
  'dns/promises',
  'fs/promises',
  'path/posix',
  'path/win32',
  'readline/promises',
  'stream/consumers',
  'stream/promises',
  'stream/web',
  'timers/promises',
  'util/types',
  'wasi'
])

export function isBuiltin(id: string): boolean {
  return builtins.has(id.replace(/^node:/, ''))
}

export function moduleListContains(
  moduleList: string[] | undefined,
  id: string
): boolean | undefined {
  return moduleList?.some((m) => m === id || id.startsWith(m + '/'))
}

export const bareImportRE = /^[\w@](?!.*:\/\/)/
export const deepImportRE = /^([^@][^/]*)\/|^(@[^/]+\/[^/]+)\//

export let isRunningWithYarnPnp: boolean

// TODO: use import()
const _require = createRequire(import.meta.url)

try {
  isRunningWithYarnPnp = Boolean(_require('pnpapi'))
} catch {}

const ssrExtensions = ['.js', '.cjs', '.json', '.node']

export function resolveFrom(
  id: string,
  basedir: string,
  preserveSymlinks = false,
  ssr = false
): string {
  return resolve.sync(id, {
    basedir,
    paths: [],
    extensions: ssr ? ssrExtensions : DEFAULT_EXTENSIONS,
    // necessary to work with pnpm
    preserveSymlinks: preserveSymlinks || isRunningWithYarnPnp || false
  })
}

/**
 * like `resolveFrom` but supports resolving `>` path in `id`,
 * for example: `foo > bar > baz`
 */
export function nestedResolveFrom(
  id: string,
  basedir: string,
  preserveSymlinks = false
): string {
  const pkgs = id.split('>').map((pkg) => pkg.trim())
  try {
    for (const pkg of pkgs) {
      basedir = resolveFrom(pkg, basedir, preserveSymlinks)
    }
  } catch {}
  return basedir
}

// set in bin/vite.js
const filter = process.env.VITE_DEBUG_FILTER

const DEBUG = process.env.DEBUG

interface DebuggerOptions {
  onlyWhenFocused?: boolean | string
}

export type ViteDebugScope = `vite:${string}`

export function createDebugger(
  namespace: ViteDebugScope,
  options: DebuggerOptions = {}
): debug.Debugger['log'] {
  const log = debug(namespace)
  const { onlyWhenFocused } = options
  const focus =
    typeof onlyWhenFocused === 'string' ? onlyWhenFocused : namespace
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

function testCaseInsensitiveFS() {
  if (!CLIENT_ENTRY.endsWith('client.mjs')) {
    throw new Error(
      `cannot test case insensitive FS, CLIENT_ENTRY const doesn't contain client.mjs`
    )
  }
  if (!fs.existsSync(CLIENT_ENTRY)) {
    throw new Error(
      'cannot test case insensitive FS, CLIENT_ENTRY does not point to an existing file: ' +
        CLIENT_ENTRY
    )
  }
  return fs.existsSync(CLIENT_ENTRY.replace('client.mjs', 'cLiEnT.mjs'))
}

export const isCaseInsensitiveFS = testCaseInsensitiveFS()

export const isWindows = os.platform() === 'win32'

const VOLUME_RE = /^[A-Z]:/i

export function normalizePath(id: string): string {
  return path.posix.normalize(isWindows ? slash(id) : id)
}

export function fsPathFromId(id: string): string {
  const fsPath = normalizePath(
    id.startsWith(FS_PREFIX) ? id.slice(FS_PREFIX.length) : id
  )
  return fsPath.startsWith('/') || fsPath.match(VOLUME_RE)
    ? fsPath
    : `/${fsPath}`
}

export function fsPathFromUrl(url: string): string {
  return fsPathFromId(cleanUrl(url))
}

/**
 * Check if dir is a parent of file
 *
 * Warning: parameters are not validated, only works with normalized absolute paths
 *
 * @param dir - normalized absolute path
 * @param file - normalized absolute path
 * @returns true if dir is a parent of file
 */
export function isParentDirectory(dir: string, file: string): boolean {
  if (!dir.endsWith('/')) {
    dir = `${dir}/`
  }
  return (
    file.startsWith(dir) ||
    (isCaseInsensitiveFS && file.toLowerCase().startsWith(dir.toLowerCase()))
  )
}

export function ensureVolumeInPath(file: string): string {
  return isWindows ? path.resolve(file) : file
}

export const queryRE = /\?.*$/s
export const hashRE = /#.*$/s

export const cleanUrl = (url: string): string =>
  url.replace(hashRE, '').replace(queryRE, '')

export const externalRE = /^(https?:)?\/\//
export const isExternalUrl = (url: string): boolean => externalRE.test(url)

export const dataUrlRE = /^\s*data:/i
export const isDataUrl = (url: string): boolean => dataUrlRE.test(url)

export const virtualModuleRE = /^virtual-module:.*/
export const virtualModulePrefix = 'virtual-module:'

const knownJsSrcRE = /\.((j|t)sx?|mjs|vue|marko|svelte|astro)($|\?)/
export const isJSRequest = (url: string): boolean => {
  url = cleanUrl(url)
  if (knownJsSrcRE.test(url)) {
    return true
  }
  if (!path.extname(url) && !url.endsWith('/')) {
    return true
  }
  return false
}

const knownTsRE = /\.(ts|mts|cts|tsx)$/
const knownTsOutputRE = /\.(js|mjs|cjs|jsx)$/
export const isTsRequest = (url: string): boolean => knownTsRE.test(url)
export const isPossibleTsOutput = (url: string): boolean =>
  knownTsOutputRE.test(cleanUrl(url))
export function getPotentialTsSrcPaths(filePath: string): string[] {
  const [name, type, query = ''] = filePath.split(/(\.(?:[cm]?js|jsx))(\?.*)?$/)
  const paths = [name + type.replace('js', 'ts') + query]
  if (!type.endsWith('x')) {
    paths.push(name + type.replace('js', 'tsx') + query)
  }
  return paths
}

const importQueryRE = /(\?|&)import=?(?:&|$)/
const internalPrefixes = [
  FS_PREFIX,
  VALID_ID_PREFIX,
  CLIENT_PUBLIC_PATH,
  ENV_PUBLIC_PATH
]
const InternalPrefixRE = new RegExp(`^(?:${internalPrefixes.join('|')})`)
const trailingSeparatorRE = /[\?&]$/
export const isImportRequest = (url: string): boolean => importQueryRE.test(url)
export const isInternalRequest = (url: string): boolean =>
  InternalPrefixRE.test(url)

export function removeImportQuery(url: string): string {
  return url.replace(importQueryRE, '$1').replace(trailingSeparatorRE, '')
}

export function injectQuery(url: string, queryToInject: string): string {
  // encode percents for consistent behavior with pathToFileURL
  // see #2614 for details
  let resolvedUrl = new URL(url.replace(/%/g, '%25'), 'relative:///')
  if (resolvedUrl.protocol !== 'relative:') {
    resolvedUrl = pathToFileURL(url)
  }
  let { protocol, pathname, search, hash } = resolvedUrl
  if (protocol === 'file:') {
    pathname = pathname.slice(1)
  }
  pathname = decodeURIComponent(pathname)
  return `${pathname}?${queryToInject}${search ? `&` + search.slice(1) : ''}${
    hash ?? ''
  }`
}

const timestampRE = /\bt=\d{13}&?\b/
export function removeTimestampQuery(url: string): string {
  return url.replace(timestampRE, '').replace(trailingSeparatorRE, '')
}

export function isRelativeBase(base: string): boolean {
  return base === '' || base.startsWith('.')
}

export async function asyncReplace(
  input: string,
  re: RegExp,
  replacer: (match: RegExpExecArray) => string | Promise<string>
): Promise<string> {
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

export function timeFrom(start: number, subtract = 0): string {
  const time: number | string = performance.now() - start - subtract
  const timeString = (time.toFixed(2) + `ms`).padEnd(5, ' ')
  if (time < 10) {
    return colors.green(timeString)
  } else if (time < 50) {
    return colors.yellow(timeString)
  } else {
    return colors.red(timeString)
  }
}

/**
 * pretty url for logging.
 */
export function prettifyUrl(url: string, root: string): string {
  url = removeTimestampQuery(url)
  const isAbsoluteFile = url.startsWith(root)
  if (isAbsoluteFile || url.startsWith(FS_PREFIX)) {
    let file = path.relative(root, isAbsoluteFile ? url : fsPathFromId(url))
    const seg = file.split('/')
    const npmIndex = seg.indexOf(`node_modules`)
    const isSourceMap = file.endsWith('.map')
    if (npmIndex > 0) {
      file = seg[npmIndex + 1]
      if (file.startsWith('@')) {
        file = `${file}/${seg[npmIndex + 2]}`
      }
      file = `npm: ${colors.dim(file)}${isSourceMap ? ` (source map)` : ``}`
    }
    return colors.dim(file)
  } else {
    return colors.dim(url)
  }
}

export function isObject(value: unknown): value is Record<string, any> {
  return Object.prototype.toString.call(value) === '[object Object]'
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return value != null
}

interface LookupFileOptions {
  pathOnly?: boolean
  rootDir?: string
}

export function lookupFile(
  dir: string,
  formats: string[],
  options?: LookupFileOptions
): string | undefined {
  for (const format of formats) {
    const fullPath = path.join(dir, format)
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return options?.pathOnly ? fullPath : fs.readFileSync(fullPath, 'utf-8')
    }
  }
  const parentDir = path.dirname(dir)
  if (
    parentDir !== dir &&
    (!options?.rootDir || parentDir.startsWith(options?.rootDir))
  ) {
    return lookupFile(parentDir, formats, options)
  }
}

const splitRE = /\r?\n/

const range: number = 2

export function pad(source: string, n = 2): string {
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
  for (let i = 0; i < line - 1; i++) {
    if (lines[i]) {
      start += lines[i].length + 1
    }
  }
  return start + column
}

export function numberToPos(
  source: string,
  offset: number | { line: number; column: number }
): { line: number; column: number } {
  if (typeof offset !== 'number') return offset
  if (offset > source.length) {
    throw new Error(
      `offset is longer than source length! offset ${offset} > length ${source.length}`
    )
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

export function writeFile(
  filename: string,
  content: string | Uint8Array
): void {
  const dir = path.dirname(filename)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filename, content)
}

/**
 * Use fs.statSync(filename) instead of fs.existsSync(filename)
 * #2051 if we don't have read permission on a directory, existsSync() still
 * works and will result in massively slow subsequent checks (which are
 * unnecessary in the first place)
 */
export function isFileReadable(filename: string): boolean {
  try {
    const stat = fs.statSync(filename, { throwIfNoEntry: false })
    return !!stat
  } catch {
    return false
  }
}

/**
 * Delete every file and subdirectory. **The given directory must exist.**
 * Pass an optional `skip` array to preserve files in the root directory.
 */
export function emptyDir(dir: string, skip?: string[]): void {
  for (const file of fs.readdirSync(dir)) {
    if (skip?.includes(file)) {
      continue
    }
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true })
  }
}

export function copyDir(srcDir: string, destDir: string): void {
  fs.mkdirSync(destDir, { recursive: true })
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file)
    if (srcFile === destDir) {
      continue
    }
    const destFile = path.resolve(destDir, file)
    const stat = fs.statSync(srcFile)
    if (stat.isDirectory()) {
      copyDir(srcFile, destFile)
    } else {
      fs.copyFileSync(srcFile, destFile)
    }
  }
}

export const removeDir = isWindows
  ? promisify(gracefulRemoveDir)
  : function removeDirSync(dir: string) {
      fs.rmSync(dir, { recursive: true, force: true })
    }
export const renameDir = isWindows ? promisify(gracefulRename) : fs.renameSync

export function ensureWatchedFile(
  watcher: FSWatcher,
  file: string | null,
  root: string
): void {
  if (
    file &&
    // only need to watch if out of root
    !file.startsWith(root + '/') &&
    // some rollup plugins use null bytes for private resolved Ids
    !file.includes('\0') &&
    fs.existsSync(file)
  ) {
    // resolve file to normalized system path
    watcher.add(path.resolve(file))
  }
}

interface ImageCandidate {
  url: string
  descriptor: string
}
const escapedSpaceCharacters = /( |\\t|\\n|\\f|\\r)+/g
const imageSetUrlRE = /^(?:[\w\-]+\(.*?\)|'.*?'|".*?"|\S*)/
function reduceSrcset(ret: { url: string; descriptor: string }[]) {
  return ret.reduce((prev, { url, descriptor }, index) => {
    descriptor ??= ''
    return (prev +=
      url + ` ${descriptor}${index === ret.length - 1 ? '' : ', '}`)
  }, '')
}

function splitSrcSetDescriptor(srcs: string): ImageCandidate[] {
  return splitSrcSet(srcs)
    .map((s) => {
      const src = s.replace(escapedSpaceCharacters, ' ').trim()
      const [url] = imageSetUrlRE.exec(src) || []

      return {
        url,
        descriptor: src?.slice(url.length).trim()
      }
    })
    .filter(({ url }) => !!url)
}

export function processSrcSet(
  srcs: string,
  replacer: (arg: ImageCandidate) => Promise<string>
): Promise<string> {
  return Promise.all(
    splitSrcSetDescriptor(srcs).map(async ({ url, descriptor }) => ({
      url: await replacer({ url, descriptor }),
      descriptor
    }))
  ).then((ret) => reduceSrcset(ret))
}

export function processSrcSetSync(
  srcs: string,
  replacer: (arg: ImageCandidate) => string
): string {
  return reduceSrcset(
    splitSrcSetDescriptor(srcs).map(({ url, descriptor }) => ({
      url: replacer({ url, descriptor }),
      descriptor
    }))
  )
}

function splitSrcSet(srcs: string) {
  const parts: string[] = []
  // There could be a ',' inside of url(data:...), linear-gradient(...) or "data:..."
  const cleanedSrcs = srcs.replace(
    /(?:url|image|gradient|cross-fade)\([^\)]*\)|"([^"]|(?<=\\)")*"|'([^']|(?<=\\)')*'/g,
    blankReplacer
  )
  let startIndex = 0
  let splitIndex: number
  do {
    splitIndex = cleanedSrcs.indexOf(',', startIndex)
    parts.push(
      srcs.slice(startIndex, splitIndex !== -1 ? splitIndex : undefined)
    )
    startIndex = splitIndex + 1
  } while (splitIndex !== -1)
  return parts
}

function escapeToLinuxLikePath(path: string) {
  if (/^[A-Z]:/.test(path)) {
    return path.replace(/^([A-Z]):\//, '/windows/$1/')
  }
  if (/^\/[^/]/.test(path)) {
    return `/linux${path}`
  }
  return path
}

function unescapeToLinuxLikePath(path: string) {
  if (path.startsWith('/linux/')) {
    return path.slice('/linux'.length)
  }
  if (path.startsWith('/windows/')) {
    return path.replace(/^\/windows\/([A-Z])\//, '$1:/')
  }
  return path
}

// based on https://github.com/sveltejs/svelte/blob/abf11bb02b2afbd3e4cac509a0f70e318c306364/src/compiler/utils/mapped_code.ts#L221
const nullSourceMap: RawSourceMap = {
  names: [],
  sources: [],
  mappings: '',
  version: 3
}
export function combineSourcemaps(
  filename: string,
  sourcemapList: Array<DecodedSourceMap | RawSourceMap>,
  excludeContent = true
): RawSourceMap {
  if (
    sourcemapList.length === 0 ||
    sourcemapList.every((m) => m.sources.length === 0)
  ) {
    return { ...nullSourceMap }
  }

  // hack for parse broken with normalized absolute paths on windows (C:/path/to/something).
  // escape them to linux like paths
  // also avoid mutation here to prevent breaking plugin's using cache to generate sourcemaps like vue (see #7442)
  sourcemapList = sourcemapList.map((sourcemap) => {
    const newSourcemaps = { ...sourcemap }
    newSourcemaps.sources = sourcemap.sources.map((source) =>
      source ? escapeToLinuxLikePath(source) : null
    )
    if (sourcemap.sourceRoot) {
      newSourcemaps.sourceRoot = escapeToLinuxLikePath(sourcemap.sourceRoot)
    }
    return newSourcemaps
  })
  const escapedFilename = escapeToLinuxLikePath(filename)

  // We don't declare type here so we can convert/fake/map as RawSourceMap
  let map //: SourceMap
  let mapIndex = 1
  const useArrayInterface =
    sourcemapList.slice(0, -1).find((m) => m.sources.length !== 1) === undefined
  if (useArrayInterface) {
    map = remapping(sourcemapList, () => null, excludeContent)
  } else {
    map = remapping(
      sourcemapList[0],
      function loader(sourcefile) {
        if (sourcefile === escapedFilename && sourcemapList[mapIndex]) {
          return sourcemapList[mapIndex++]
        } else {
          return null
        }
      },
      excludeContent
    )
  }
  if (!map.file) {
    delete map.file
  }

  // unescape the previous hack
  map.sources = map.sources.map((source) =>
    source ? unescapeToLinuxLikePath(source) : source
  )
  map.file = filename

  return map as RawSourceMap
}

export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

export interface Hostname {
  // undefined sets the default behaviour of server.listen
  host: string | undefined
  // resolve to localhost when possible
  name: string
}

export function resolveHostname(
  optionsHost: string | boolean | undefined
): Hostname {
  let host: string | undefined
  if (optionsHost === undefined || optionsHost === false) {
    // Use a secure default
    host = '127.0.0.1'
  } else if (optionsHost === true) {
    // If passed --host in the CLI without arguments
    host = undefined // undefined typically means 0.0.0.0 or :: (listen on all IPs)
  } else {
    host = optionsHost
  }

  // Set host name to localhost when possible, unless the user explicitly asked for '127.0.0.1'
  const name =
    (optionsHost !== '127.0.0.1' && host === '127.0.0.1') ||
    host === '0.0.0.0' ||
    host === '::' ||
    host === undefined
      ? 'localhost'
      : host

  return { host, name }
}

export function arraify<T>(target: T | T[]): T[] {
  return Array.isArray(target) ? target : [target]
}

export function toUpperCaseDriveLetter(pathName: string): string {
  return pathName.replace(/^\w:/, (letter) => letter.toUpperCase())
}

export const multilineCommentsRE = /\/\*(.|[\r\n])*?\*\//gm
export const singlelineCommentsRE = /\/\/.*/g
export const requestQuerySplitRE = /\?(?!.*[\/|\}])/

// @ts-expect-error
export const usingDynamicImport = typeof jest === 'undefined'

/**
 * Dynamically import files. It will make sure it's not being compiled away by TS/Rollup.
 *
 * As a temporary workaround for Jest's lack of stable ESM support, we fallback to require
 * if we're in a Jest environment.
 * See https://github.com/vitejs/vite/pull/5197#issuecomment-938054077
 *
 * @param file File path to import.
 */
export const dynamicImport = usingDynamicImport
  ? new Function('file', 'return import(file)')
  : _require

export function parseRequest(id: string): Record<string, string> | null {
  const [_, search] = id.split(requestQuerySplitRE, 2)
  if (!search) {
    return null
  }
  return Object.fromEntries(new URLSearchParams(search))
}

export const blankReplacer = (match: string): string => ' '.repeat(match.length)

export function getHash(text: Buffer | string): string {
  return createHash('sha256').update(text).digest('hex').substring(0, 8)
}

// Based on node-graceful-fs

// The ISC License
// Copyright (c) 2011-2022 Isaac Z. Schlueter, Ben Noordhuis, and Contributors
// https://github.com/isaacs/node-graceful-fs/blob/main/LICENSE

// On Windows, A/V software can lock the directory, causing this
// to fail with an EACCES or EPERM if the directory contains newly
// created files. The original tried for up to 60 seconds, we only
// wait for 5 seconds, as a longer time would be seen as an error

const GRACEFUL_RENAME_TIMEOUT = 5000
function gracefulRename(
  from: string,
  to: string,
  cb: (error: NodeJS.ErrnoException | null) => void
) {
  const start = Date.now()
  let backoff = 0
  fs.rename(from, to, function CB(er) {
    if (
      er &&
      (er.code === 'EACCES' || er.code === 'EPERM') &&
      Date.now() - start < GRACEFUL_RENAME_TIMEOUT
    ) {
      setTimeout(function () {
        fs.stat(to, function (stater, st) {
          if (stater && stater.code === 'ENOENT') fs.rename(from, to, CB)
          else CB(er)
        })
      }, backoff)
      if (backoff < 100) backoff += 10
      return
    }
    if (cb) cb(er)
  })
}

const GRACEFUL_REMOVE_DIR_TIMEOUT = 5000
function gracefulRemoveDir(
  dir: string,
  cb: (error: NodeJS.ErrnoException | null) => void
) {
  const start = Date.now()
  let backoff = 0
  fs.rm(dir, { recursive: true }, function CB(er) {
    if (er) {
      if (
        (er.code === 'ENOTEMPTY' ||
          er.code === 'EACCES' ||
          er.code === 'EPERM') &&
        Date.now() - start < GRACEFUL_REMOVE_DIR_TIMEOUT
      ) {
        setTimeout(function () {
          fs.rm(dir, { recursive: true }, CB)
        }, backoff)
        if (backoff < 100) backoff += 10
        return
      }

      if (er.code === 'ENOENT') {
        er = null
      }
    }

    if (cb) cb(er)
  })
}

export function emptyCssComments(raw: string): string {
  return raw.replace(multilineCommentsRE, (s) => ' '.repeat(s.length))
}

function mergeConfigRecursively(
  defaults: Record<string, any>,
  overrides: Record<string, any>,
  rootPath: string
) {
  const merged: Record<string, any> = { ...defaults }
  for (const key in overrides) {
    const value = overrides[key]
    if (value == null) {
      continue
    }

    const existing = merged[key]

    if (existing == null) {
      merged[key] = value
      continue
    }

    // fields that require special handling
    if (key === 'alias' && (rootPath === 'resolve' || rootPath === '')) {
      merged[key] = mergeAlias(existing, value)
      continue
    } else if (key === 'assetsInclude' && rootPath === '') {
      merged[key] = [].concat(existing, value)
      continue
    } else if (
      key === 'noExternal' &&
      rootPath === 'ssr' &&
      (existing === true || value === true)
    ) {
      merged[key] = true
      continue
    }

    if (Array.isArray(existing) || Array.isArray(value)) {
      merged[key] = [...arraify(existing ?? []), ...arraify(value ?? [])]
      continue
    }
    if (isObject(existing) && isObject(value)) {
      merged[key] = mergeConfigRecursively(
        existing,
        value,
        rootPath ? `${rootPath}.${key}` : key
      )
      continue
    }

    merged[key] = value
  }
  return merged
}

export function mergeConfig(
  defaults: Record<string, any>,
  overrides: Record<string, any>,
  isRoot = true
): Record<string, any> {
  return mergeConfigRecursively(defaults, overrides, isRoot ? '' : '.')
}

export function mergeAlias(
  a?: AliasOptions,
  b?: AliasOptions
): AliasOptions | undefined {
  if (!a) return b
  if (!b) return a
  if (isObject(a) && isObject(b)) {
    return { ...a, ...b }
  }
  // the order is flipped because the alias is resolved from top-down,
  // where the later should have higher priority
  return [...normalizeAlias(b), ...normalizeAlias(a)]
}

export function normalizeAlias(o: AliasOptions = []): Alias[] {
  return Array.isArray(o)
    ? o.map(normalizeSingleAlias)
    : Object.keys(o).map((find) =>
        normalizeSingleAlias({
          find,
          replacement: (o as any)[find]
        })
      )
}

// https://github.com/vitejs/vite/issues/1363
// work around https://github.com/rollup/plugins/issues/759
function normalizeSingleAlias({
  find,
  replacement,
  customResolver
}: Alias): Alias {
  if (
    typeof find === 'string' &&
    find.endsWith('/') &&
    replacement.endsWith('/')
  ) {
    find = find.slice(0, find.length - 1)
    replacement = replacement.slice(0, replacement.length - 1)
  }

  const alias: Alias = {
    find,
    replacement
  }
  if (customResolver) {
    alias.customResolver = customResolver
  }
  return alias
}

export function transformResult(
  s: MagicString,
  id: string,
  config: ResolvedConfig
): TransformResult {
  const isBuild = config.command === 'build'
  const needSourceMap = !isBuild || config.build.sourcemap
  return {
    code: s.toString(),
    map: needSourceMap ? s.generateMap({ hires: true, source: id }) : null
  }
}
