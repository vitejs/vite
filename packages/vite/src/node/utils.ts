import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { exec } from 'node:child_process'
import crypto from 'node:crypto'
import { URL, fileURLToPath } from 'node:url'
import { builtinModules, createRequire } from 'node:module'
import { promises as dns } from 'node:dns'
import { performance } from 'node:perf_hooks'
import type { AddressInfo, Server } from 'node:net'
import fsp from 'node:fs/promises'
import type { FSWatcher } from 'dep-types/chokidar'
import remapping from '@ampproject/remapping'
import type { DecodedSourceMap, RawSourceMap } from '@ampproject/remapping'
import colors from 'picocolors'
import debug from 'debug'
import type { Alias, AliasOptions } from 'dep-types/alias'
import type MagicString from 'magic-string'
import type { Equal } from '@type-challenges/utils'

import type { TransformResult } from 'rollup'
import { createFilter as _createFilter } from '@rollup/pluginutils'
import {
  cleanUrl,
  isWindows,
  slash,
  splitFileAndPostfix,
  withTrailingSlash,
} from '../shared/utils'
import { VALID_ID_PREFIX } from '../shared/constants'
import {
  CLIENT_ENTRY,
  CLIENT_PUBLIC_PATH,
  ENV_PUBLIC_PATH,
  FS_PREFIX,
  OPTIMIZABLE_ENTRY_RE,
  loopbackHosts,
  wildcardHosts,
} from './constants'
import type { DepOptimizationOptions } from './optimizer'
import type { ResolvedConfig } from './config'
import type { ResolvedServerUrls, ViteDevServer } from './server'
import type { PreviewServer } from './preview'
import {
  type PackageCache,
  findNearestPackageData,
  resolvePackageData,
} from './packages'
import type { CommonServerOptions } from '.'

/**
 * Inlined to keep `@rollup/pluginutils` in devDependencies
 */
export type FilterPattern =
  | ReadonlyArray<string | RegExp>
  | string
  | RegExp
  | null
export const createFilter = _createFilter as (
  include?: FilterPattern,
  exclude?: FilterPattern,
  options?: { resolve?: string | false | null },
) => (id: string | unknown) => boolean

const replaceSlashOrColonRE = /[/:]/g
const replaceDotRE = /\./g
const replaceNestedIdRE = /\s*>\s*/g
const replaceHashRE = /#/g
export const flattenId = (id: string): string => {
  const flatId = limitFlattenIdLength(
    id
      .replace(replaceSlashOrColonRE, '_')
      .replace(replaceDotRE, '__')
      .replace(replaceNestedIdRE, '___')
      .replace(replaceHashRE, '____'),
  )
  return flatId
}

const FLATTEN_ID_HASH_LENGTH = 8
const FLATTEN_ID_MAX_FILE_LENGTH = 170

const limitFlattenIdLength = (
  id: string,
  limit: number = FLATTEN_ID_MAX_FILE_LENGTH,
): string => {
  if (id.length <= limit) {
    return id
  }
  return id.slice(0, limit - (FLATTEN_ID_HASH_LENGTH + 1)) + '_' + getHash(id)
}

export const normalizeId = (id: string): string =>
  id.replace(replaceNestedIdRE, ' > ')

// Supported by Node, Deno, Bun
const NODE_BUILTIN_NAMESPACE = 'node:'
// Supported by Deno
const NPM_BUILTIN_NAMESPACE = 'npm:'
// Supported by Bun
const BUN_BUILTIN_NAMESPACE = 'bun:'
// Some runtimes like Bun injects namespaced modules here, which is not a node builtin
const nodeBuiltins = builtinModules.filter((id) => !id.includes(':'))

const isBuiltinCache = new WeakMap<
  (string | RegExp)[],
  (id: string, importer?: string) => boolean
>()

export function isBuiltin(builtins: (string | RegExp)[], id: string): boolean {
  let isBuiltin = isBuiltinCache.get(builtins)
  if (!isBuiltin) {
    isBuiltin = createIsBuiltin(builtins)
    isBuiltinCache.set(builtins, isBuiltin)
  }
  return isBuiltin(id)
}

export function createIsBuiltin(
  builtins: (string | RegExp)[],
): (id: string) => boolean {
  const plainBuiltinsSet = new Set(
    builtins.filter((builtin) => typeof builtin === 'string'),
  )
  const regexBuiltins = builtins.filter(
    (builtin) => typeof builtin !== 'string',
  )

  return (id) =>
    plainBuiltinsSet.has(id) || regexBuiltins.some((regexp) => regexp.test(id))
}

export const nodeLikeBuiltins = [
  ...nodeBuiltins,
  new RegExp(`^${NODE_BUILTIN_NAMESPACE}`),
  new RegExp(`^${NPM_BUILTIN_NAMESPACE}`),
  new RegExp(`^${BUN_BUILTIN_NAMESPACE}`),
]

export function isNodeLikeBuiltin(id: string): boolean {
  return isBuiltin(nodeLikeBuiltins, id)
}

export function isNodeBuiltin(id: string): boolean {
  if (id.startsWith(NODE_BUILTIN_NAMESPACE)) return true
  return nodeBuiltins.includes(id)
}

export function isInNodeModules(id: string): boolean {
  return id.includes('node_modules')
}

export function moduleListContains(
  moduleList: string[] | undefined,
  id: string,
): boolean | undefined {
  return moduleList?.some(
    (m) => m === id || id.startsWith(withTrailingSlash(m)),
  )
}

export function isOptimizable(
  id: string,
  optimizeDeps: DepOptimizationOptions,
): boolean {
  const { extensions } = optimizeDeps
  return (
    OPTIMIZABLE_ENTRY_RE.test(id) ||
    (extensions?.some((ext) => id.endsWith(ext)) ?? false)
  )
}

export const bareImportRE = /^(?![a-zA-Z]:)[\w@](?!.*:\/\/)/
export const deepImportRE = /^([^@][^/]*)\/|^(@[^/]+\/[^/]+)\//

// TODO: use import()
const _require = createRequire(import.meta.url)

const _dirname = path.dirname(fileURLToPath(import.meta.url))

// NOTE: we don't use VERSION variable exported from rollup to avoid importing rollup in dev
export const rollupVersion =
  resolvePackageData('rollup', _dirname, true)?.data.version ?? ''

// set in bin/vite.js
const filter = process.env.VITE_DEBUG_FILTER

const DEBUG = process.env.DEBUG

interface DebuggerOptions {
  onlyWhenFocused?: boolean | string
  depth?: number
}

export type ViteDebugScope = `vite:${string}`

export function createDebugger(
  namespace: ViteDebugScope,
  options: DebuggerOptions = {},
): debug.Debugger['log'] | undefined {
  const log = debug(namespace)
  const { onlyWhenFocused, depth } = options

  // @ts-expect-error - The log function is bound to inspectOpts, but the type is not reflected
  if (depth && log.inspectOpts && log.inspectOpts.depth == null) {
    // @ts-expect-error - The log function is bound to inspectOpts, but the type is not reflected
    log.inspectOpts.depth = options.depth
  }

  let enabled = log.enabled
  if (enabled && onlyWhenFocused) {
    const ns = typeof onlyWhenFocused === 'string' ? onlyWhenFocused : namespace
    enabled = !!DEBUG?.includes(ns)
  }

  if (enabled) {
    return (...args: [string, ...any[]]) => {
      if (!filter || args.some((a) => a?.includes?.(filter))) {
        log(...args)
      }
    }
  }
}

function testCaseInsensitiveFS() {
  if (!CLIENT_ENTRY.endsWith('client.mjs')) {
    throw new Error(
      `cannot test case insensitive FS, CLIENT_ENTRY const doesn't contain client.mjs`,
    )
  }
  if (!fs.existsSync(CLIENT_ENTRY)) {
    throw new Error(
      'cannot test case insensitive FS, CLIENT_ENTRY does not point to an existing file: ' +
        CLIENT_ENTRY,
    )
  }
  return fs.existsSync(CLIENT_ENTRY.replace('client.mjs', 'cLiEnT.mjs'))
}

export const urlCanParse =
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  URL.canParse ??
  // URL.canParse is supported from Node.js 18.17.0+, 20.0.0+
  ((path: string, base?: string | undefined): boolean => {
    try {
      new URL(path, base)
      return true
    } catch {
      return false
    }
  })

export const isCaseInsensitiveFS = testCaseInsensitiveFS()

const VOLUME_RE = /^[A-Z]:/i

export function normalizePath(id: string): string {
  return path.posix.normalize(isWindows ? slash(id) : id)
}

export function fsPathFromId(id: string): string {
  const fsPath = normalizePath(
    id.startsWith(FS_PREFIX) ? id.slice(FS_PREFIX.length) : id,
  )
  return fsPath[0] === '/' || VOLUME_RE.test(fsPath) ? fsPath : `/${fsPath}`
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
  dir = withTrailingSlash(dir)
  return (
    file.startsWith(dir) ||
    (isCaseInsensitiveFS && file.toLowerCase().startsWith(dir.toLowerCase()))
  )
}

/**
 * Check if 2 file name are identical
 *
 * Warning: parameters are not validated, only works with normalized absolute paths
 *
 * @param file1 - normalized absolute path
 * @param file2 - normalized absolute path
 * @returns true if both files url are identical
 */
export function isSameFileUri(file1: string, file2: string): boolean {
  return (
    file1 === file2 ||
    (isCaseInsensitiveFS && file1.toLowerCase() === file2.toLowerCase())
  )
}

export const externalRE = /^([a-z]+:)?\/\//
export const isExternalUrl = (url: string): boolean => externalRE.test(url)

export const dataUrlRE = /^\s*data:/i
export const isDataUrl = (url: string): boolean => dataUrlRE.test(url)

export const virtualModuleRE = /^virtual-module:.*/
export const virtualModulePrefix = 'virtual-module:'

// NOTE: We should start relying on the "Sec-Fetch-Dest" header instead of this
// hardcoded list. We can eventually remove this function when the minimum version
// of browsers we support in dev all support this header.
const knownJsSrcRE =
  /\.(?:[jt]sx?|m[jt]s|vue|marko|svelte|astro|imba|mdx)(?:$|\?)/
export const isJSRequest = (url: string): boolean => {
  url = cleanUrl(url)
  if (knownJsSrcRE.test(url)) {
    return true
  }
  if (!path.extname(url) && url[url.length - 1] !== '/') {
    return true
  }
  return false
}

const knownTsRE = /\.(?:ts|mts|cts|tsx)(?:$|\?)/
export const isTsRequest = (url: string): boolean => knownTsRE.test(url)

const importQueryRE = /(\?|&)import=?(?:&|$)/
const directRequestRE = /(\?|&)direct=?(?:&|$)/
const internalPrefixes = [
  FS_PREFIX,
  VALID_ID_PREFIX,
  CLIENT_PUBLIC_PATH,
  ENV_PUBLIC_PATH,
]
const InternalPrefixRE = new RegExp(`^(?:${internalPrefixes.join('|')})`)
const trailingSeparatorRE = /[?&]$/
export const isImportRequest = (url: string): boolean => importQueryRE.test(url)
export const isInternalRequest = (url: string): boolean =>
  InternalPrefixRE.test(url)

export function removeImportQuery(url: string): string {
  return url.replace(importQueryRE, '$1').replace(trailingSeparatorRE, '')
}
export function removeDirectQuery(url: string): string {
  return url.replace(directRequestRE, '$1').replace(trailingSeparatorRE, '')
}

export const urlRE = /(\?|&)url(?:&|$)/
export const rawRE = /(\?|&)raw(?:&|$)/
export function removeUrlQuery(url: string): string {
  return url.replace(urlRE, '$1').replace(trailingSeparatorRE, '')
}
export function removeRawQuery(url: string): string {
  return url.replace(rawRE, '$1').replace(trailingSeparatorRE, '')
}

export function injectQuery(url: string, queryToInject: string): string {
  const { file, postfix } = splitFileAndPostfix(url)
  const normalizedFile = isWindows ? slash(file) : file
  return `${normalizedFile}?${queryToInject}${postfix[0] === '?' ? `&${postfix.slice(1)}` : /* hash only */ postfix}`
}

const timestampRE = /\bt=\d{13}&?\b/
export function removeTimestampQuery(url: string): string {
  return url.replace(timestampRE, '').replace(trailingSeparatorRE, '')
}

export async function asyncReplace(
  input: string,
  re: RegExp,
  replacer: (match: RegExpExecArray) => string | Promise<string>,
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
    const file = path.posix.relative(
      root,
      isAbsoluteFile ? url : fsPathFromId(url),
    )
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

export function tryStatSync(file: string): fs.Stats | undefined {
  try {
    // The "throwIfNoEntry" is a performance optimization for cases where the file does not exist
    return fs.statSync(file, { throwIfNoEntry: false })
  } catch {
    // Ignore errors
  }
}

export function lookupFile(
  dir: string,
  fileNames: string[],
): string | undefined {
  while (dir) {
    for (const fileName of fileNames) {
      const fullPath = path.join(dir, fileName)
      if (tryStatSync(fullPath)?.isFile()) return fullPath
    }
    const parentDir = path.dirname(dir)
    if (parentDir === dir) return

    dir = parentDir
  }
}

export function isFilePathESM(
  filePath: string,
  packageCache?: PackageCache,
): boolean {
  if (/\.m[jt]s$/.test(filePath)) {
    return true
  } else if (/\.c[jt]s$/.test(filePath)) {
    return false
  } else {
    // check package.json for type: "module"
    try {
      const pkg = findNearestPackageData(path.dirname(filePath), packageCache)
      return pkg?.data.type === 'module'
    } catch {
      return false
    }
  }
}

export const splitRE = /\r?\n/g

const range: number = 2

export function pad(source: string, n = 2): string {
  const lines = source.split(splitRE)
  return lines.map((l) => ` `.repeat(n) + l).join(`\n`)
}

type Pos = {
  /** 1-based */
  line: number
  /** 0-based */
  column: number
}

export function posToNumber(source: string, pos: number | Pos): number {
  if (typeof pos === 'number') return pos
  const lines = source.split(splitRE)
  const { line, column } = pos
  let start = 0
  for (let i = 0; i < line - 1 && i < lines.length; i++) {
    start += lines[i].length + 1
  }
  return start + column
}

export function numberToPos(source: string, offset: number | Pos): Pos {
  if (typeof offset !== 'number') return offset
  if (offset > source.length) {
    throw new Error(
      `offset is longer than source length! offset ${offset} > length ${source.length}`,
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
  start: number | Pos = 0,
  end?: number | Pos,
): string {
  start = Math.max(posToNumber(source, start), 0)
  end = Math.min(
    end !== undefined ? posToNumber(source, end) : start,
    source.length,
  )
  const lines = source.split(splitRE)
  let count = 0
  const res: string[] = []
  for (let i = 0; i < lines.length; i++) {
    count += lines[i].length
    if (count >= start) {
      for (let j = i - range; j <= i + range || end > count; j++) {
        if (j < 0 || j >= lines.length) continue
        const line = j + 1
        res.push(
          `${line}${' '.repeat(Math.max(3 - String(line).length, 0))}|  ${
            lines[j]
          }`,
        )
        const lineLength = lines[j].length
        if (j === i) {
          // push underline
          const pad = Math.max(start - (count - lineLength), 0)
          const length = Math.max(
            1,
            end > count ? lineLength - pad : end - start,
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
    count++
  }
  return res.join('\n')
}

export function isFileReadable(filename: string): boolean {
  if (!tryStatSync(filename)) {
    return false
  }

  try {
    // Check if current process has read permission to the file
    fs.accessSync(filename, fs.constants.R_OK)

    return true
  } catch {
    return false
  }
}

const splitFirstDirRE = /(.+?)[\\/](.+)/

/**
 * Delete every file and subdirectory. **The given directory must exist.**
 * Pass an optional `skip` array to preserve files under the root directory.
 */
export function emptyDir(dir: string, skip?: string[]): void {
  const skipInDir: string[] = []
  let nested: Map<string, string[]> | null = null
  if (skip?.length) {
    for (const file of skip) {
      if (path.dirname(file) !== '.') {
        const matched = splitFirstDirRE.exec(file)
        if (matched) {
          nested ??= new Map()
          const [, nestedDir, skipPath] = matched
          let nestedSkip = nested.get(nestedDir)
          if (!nestedSkip) {
            nestedSkip = []
            nested.set(nestedDir, nestedSkip)
          }
          if (!nestedSkip.includes(skipPath)) {
            nestedSkip.push(skipPath)
          }
        }
      } else {
        skipInDir.push(file)
      }
    }
  }
  for (const file of fs.readdirSync(dir)) {
    if (skipInDir.includes(file)) {
      continue
    }
    if (nested?.has(file)) {
      emptyDir(path.resolve(dir, file), nested.get(file))
    } else {
      fs.rmSync(path.resolve(dir, file), { recursive: true, force: true })
    }
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

export const ERR_SYMLINK_IN_RECURSIVE_READDIR =
  'ERR_SYMLINK_IN_RECURSIVE_READDIR'
export async function recursiveReaddir(dir: string): Promise<string[]> {
  if (!fs.existsSync(dir)) {
    return []
  }
  let dirents: fs.Dirent[]
  try {
    dirents = await fsp.readdir(dir, { withFileTypes: true })
  } catch (e) {
    if (e.code === 'EACCES') {
      // Ignore permission errors
      return []
    }
    throw e
  }
  if (dirents.some((dirent) => dirent.isSymbolicLink())) {
    const err: any = new Error(
      'Symbolic links are not supported in recursiveReaddir',
    )
    err.code = ERR_SYMLINK_IN_RECURSIVE_READDIR
    throw err
  }
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name)
      return dirent.isDirectory() ? recursiveReaddir(res) : normalizePath(res)
    }),
  )
  return files.flat(1)
}

// `fs.realpathSync.native` resolves differently in Windows network drive,
// causing file read errors. skip for now.
// https://github.com/nodejs/node/issues/37737
export let safeRealpathSync = isWindows
  ? windowsSafeRealPathSync
  : fs.realpathSync.native

// Based on https://github.com/larrybahr/windows-network-drive
// MIT License, Copyright (c) 2017 Larry Bahr
const windowsNetworkMap = new Map()
function windowsMappedRealpathSync(path: string) {
  const realPath = fs.realpathSync.native(path)
  if (realPath.startsWith('\\\\')) {
    for (const [network, volume] of windowsNetworkMap) {
      if (realPath.startsWith(network)) return realPath.replace(network, volume)
    }
  }
  return realPath
}
const parseNetUseRE = /^\w* +(\w:) +([^ ]+)\s/
let firstSafeRealPathSyncRun = false

function windowsSafeRealPathSync(path: string): string {
  if (!firstSafeRealPathSyncRun) {
    optimizeSafeRealPathSync()
    firstSafeRealPathSyncRun = true
  }
  return fs.realpathSync(path)
}

function optimizeSafeRealPathSync() {
  // Skip if using Node <18.10 due to MAX_PATH issue: https://github.com/vitejs/vite/issues/12931
  const nodeVersion = process.versions.node.split('.').map(Number)
  if (nodeVersion[0] < 18 || (nodeVersion[0] === 18 && nodeVersion[1] < 10)) {
    safeRealpathSync = fs.realpathSync
    return
  }
  // Check the availability `fs.realpathSync.native`
  // in Windows virtual and RAM disks that bypass the Volume Mount Manager, in programs such as imDisk
  // get the error EISDIR: illegal operation on a directory
  try {
    fs.realpathSync.native(path.resolve('./'))
  } catch (error) {
    if (error.message.includes('EISDIR: illegal operation on a directory')) {
      safeRealpathSync = fs.realpathSync
      return
    }
  }
  exec('net use', (error, stdout) => {
    if (error) return
    const lines = stdout.split('\n')
    // OK           Y:        \\NETWORKA\Foo         Microsoft Windows Network
    // OK           Z:        \\NETWORKA\Bar         Microsoft Windows Network
    for (const line of lines) {
      const m = parseNetUseRE.exec(line)
      if (m) windowsNetworkMap.set(m[2], m[1])
    }
    if (windowsNetworkMap.size === 0) {
      safeRealpathSync = fs.realpathSync.native
    } else {
      safeRealpathSync = windowsMappedRealpathSync
    }
  })
}

export function ensureWatchedFile(
  watcher: FSWatcher,
  file: string | null,
  root: string,
): void {
  if (
    file &&
    // only need to watch if out of root
    !file.startsWith(withTrailingSlash(root)) &&
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

function joinSrcset(ret: ImageCandidate[]) {
  return ret
    .map(({ url, descriptor }) => url + (descriptor ? ` ${descriptor}` : ''))
    .join(', ')
}

/**
 This regex represents a loose rule of an “image candidate string” and "image set options".

 @see https://html.spec.whatwg.org/multipage/images.html#srcset-attribute
 @see https://drafts.csswg.org/css-images-4/#image-set-notation

  The Regex has named capturing groups `url` and `descriptor`.
  The `url` group can be:
  * any CSS function
  * CSS string (single or double-quoted)
  * URL string (unquoted)
  The `descriptor` is anything after the space and before the comma.
 */
const imageCandidateRegex =
  /(?:^|\s)(?<url>[\w-]+\([^)]*\)|"[^"]*"|'[^']*'|[^,]\S*[^,])\s*(?:\s(?<descriptor>\w[^,]+))?(?:,|$)/g
const escapedSpaceCharacters = /(?: |\\t|\\n|\\f|\\r)+/g

export function parseSrcset(string: string): ImageCandidate[] {
  const matches = string
    .trim()
    .replace(escapedSpaceCharacters, ' ')
    .replace(/\r?\n/, '')
    .replace(/,\s+/, ', ')
    .replaceAll(/\s+/g, ' ')
    .matchAll(imageCandidateRegex)
  return Array.from(matches, ({ groups }) => ({
    url: groups?.url?.trim() ?? '',
    descriptor: groups?.descriptor?.trim() ?? '',
  })).filter(({ url }) => !!url)
}

export function processSrcSet(
  srcs: string,
  replacer: (arg: ImageCandidate) => Promise<string>,
): Promise<string> {
  return Promise.all(
    parseSrcset(srcs).map(async ({ url, descriptor }) => ({
      url: await replacer({ url, descriptor }),
      descriptor,
    })),
  ).then(joinSrcset)
}

export function processSrcSetSync(
  srcs: string,
  replacer: (arg: ImageCandidate) => string,
): string {
  return joinSrcset(
    parseSrcset(srcs).map(({ url, descriptor }) => ({
      url: replacer({ url, descriptor }),
      descriptor,
    })),
  )
}

const windowsDriveRE = /^[A-Z]:/
const replaceWindowsDriveRE = /^([A-Z]):\//
const linuxAbsolutePathRE = /^\/[^/]/
function escapeToLinuxLikePath(path: string) {
  if (windowsDriveRE.test(path)) {
    return path.replace(replaceWindowsDriveRE, '/windows/$1/')
  }
  if (linuxAbsolutePathRE.test(path)) {
    return `/linux${path}`
  }
  return path
}

const revertWindowsDriveRE = /^\/windows\/([A-Z])\//
function unescapeToLinuxLikePath(path: string) {
  if (path.startsWith('/linux/')) {
    return path.slice('/linux'.length)
  }
  if (path.startsWith('/windows/')) {
    return path.replace(revertWindowsDriveRE, '$1:/')
  }
  return path
}

// based on https://github.com/sveltejs/svelte/blob/abf11bb02b2afbd3e4cac509a0f70e318c306364/src/compiler/utils/mapped_code.ts#L221
const nullSourceMap: RawSourceMap = {
  names: [],
  sources: [],
  mappings: '',
  version: 3,
}
export function combineSourcemaps(
  filename: string,
  sourcemapList: Array<DecodedSourceMap | RawSourceMap>,
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
      source ? escapeToLinuxLikePath(source) : null,
    )
    if (sourcemap.sourceRoot) {
      newSourcemaps.sourceRoot = escapeToLinuxLikePath(sourcemap.sourceRoot)
    }
    return newSourcemaps
  })

  // We don't declare type here so we can convert/fake/map as RawSourceMap
  let map //: SourceMap
  let mapIndex = 1
  const useArrayInterface =
    sourcemapList.slice(0, -1).find((m) => m.sources.length !== 1) === undefined
  if (useArrayInterface) {
    map = remapping(sourcemapList, () => null)
  } else {
    map = remapping(sourcemapList[0], function loader(sourcefile) {
      const mapForSources = sourcemapList
        .slice(mapIndex)
        .find((s) => s.sources.includes(sourcefile))

      if (mapForSources) {
        mapIndex++
        return mapForSources
      }
      return null
    })
  }
  if (!map.file) {
    delete map.file
  }

  // unescape the previous hack
  map.sources = map.sources.map((source) =>
    source ? unescapeToLinuxLikePath(source) : source,
  )
  map.file = filename

  return map as RawSourceMap
}

export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

/**
 * Returns resolved localhost address when `dns.lookup` result differs from DNS
 *
 * `dns.lookup` result is same when defaultResultOrder is `verbatim`.
 * Even if defaultResultOrder is `ipv4first`, `dns.lookup` result maybe same.
 * For example, when IPv6 is not supported on that machine/network.
 */
export async function getLocalhostAddressIfDiffersFromDNS(): Promise<
  string | undefined
> {
  const [nodeResult, dnsResult] = await Promise.all([
    dns.lookup('localhost'),
    dns.lookup('localhost', { verbatim: true }),
  ])
  const isSame =
    nodeResult.family === dnsResult.family &&
    nodeResult.address === dnsResult.address
  return isSame ? undefined : nodeResult.address
}

export function diffDnsOrderChange(
  oldUrls: ViteDevServer['resolvedUrls'],
  newUrls: ViteDevServer['resolvedUrls'],
): boolean {
  return !(
    oldUrls === newUrls ||
    (oldUrls &&
      newUrls &&
      arrayEqual(oldUrls.local, newUrls.local) &&
      arrayEqual(oldUrls.network, newUrls.network))
  )
}

export interface Hostname {
  /** undefined sets the default behaviour of server.listen */
  host: string | undefined
  /** resolve to localhost when possible */
  name: string
}

export async function resolveHostname(
  optionsHost: string | boolean | undefined,
): Promise<Hostname> {
  let host: string | undefined
  if (optionsHost === undefined || optionsHost === false) {
    // Use a secure default
    host = 'localhost'
  } else if (optionsHost === true) {
    // If passed --host in the CLI without arguments
    host = undefined // undefined typically means 0.0.0.0 or :: (listen on all IPs)
  } else {
    host = optionsHost
  }

  // Set host name to localhost when possible
  let name = host === undefined || wildcardHosts.has(host) ? 'localhost' : host

  if (host === 'localhost') {
    // See #8647 for more details.
    const localhostAddr = await getLocalhostAddressIfDiffersFromDNS()
    if (localhostAddr) {
      name = localhostAddr
    }
  }

  return { host, name }
}

export async function resolveServerUrls(
  server: Server,
  options: CommonServerOptions,
  config: ResolvedConfig,
): Promise<ResolvedServerUrls> {
  const address = server.address()

  const isAddressInfo = (x: any): x is AddressInfo => x?.address
  if (!isAddressInfo(address)) {
    return { local: [], network: [] }
  }

  const local: string[] = []
  const network: string[] = []
  const hostname = await resolveHostname(options.host)
  const protocol = options.https ? 'https' : 'http'
  const port = address.port
  const base =
    config.rawBase === './' || config.rawBase === '' ? '/' : config.rawBase

  if (hostname.host !== undefined && !wildcardHosts.has(hostname.host)) {
    let hostnameName = hostname.name
    // ipv6 host
    if (hostnameName.includes(':')) {
      hostnameName = `[${hostnameName}]`
    }
    const address = `${protocol}://${hostnameName}:${port}${base}`
    if (loopbackHosts.has(hostname.host)) {
      local.push(address)
    } else {
      network.push(address)
    }
  } else {
    Object.values(os.networkInterfaces())
      .flatMap((nInterface) => nInterface ?? [])
      .filter(
        (detail) =>
          detail.address &&
          (detail.family === 'IPv4' ||
            // @ts-expect-error Node 18.0 - 18.3 returns number
            detail.family === 4),
      )
      .forEach((detail) => {
        let host = detail.address.replace('127.0.0.1', hostname.name)
        // ipv6 host
        if (host.includes(':')) {
          host = `[${host}]`
        }
        const url = `${protocol}://${host}:${port}${base}`
        if (detail.address.includes('127.0.0.1')) {
          local.push(url)
        } else {
          network.push(url)
        }
      })
  }
  return { local, network }
}

export function arraify<T>(target: T | T[]): T[] {
  return Array.isArray(target) ? target : [target]
}

// Taken from https://stackoverflow.com/a/36328890
export const multilineCommentsRE = /\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g
export const singlelineCommentsRE = /\/\/.*/g
export const requestQuerySplitRE = /\?(?!.*[/|}])/
export const requestQueryMaybeEscapedSplitRE = /\\?\?(?!.*[/|}])/

export const blankReplacer = (match: string): string => ' '.repeat(match.length)

const hash =
  // eslint-disable-next-line n/no-unsupported-features/node-builtins -- crypto.hash is supported in Node 21.7.0+, 20.12.0+
  crypto.hash ??
  ((
    algorithm: string,
    data: crypto.BinaryLike,
    outputEncoding: crypto.BinaryToTextEncoding,
  ) => crypto.createHash(algorithm).update(data).digest(outputEncoding))

export function getHash(text: Buffer | string, length = 8): string {
  const h = hash('sha256', text, 'hex').substring(0, length)
  if (length <= 64) return h
  return h.padEnd(length, '_')
}

export const requireResolveFromRootWithFallback = (
  root: string,
  id: string,
): string => {
  // check existence first, so if the package is not found,
  // it won't be cached by nodejs, since there isn't a way to invalidate them:
  // https://github.com/nodejs/node/issues/44663
  const found = resolvePackageData(id, root) || resolvePackageData(id, _dirname)
  if (!found) {
    const error = new Error(`${JSON.stringify(id)} not found.`)
    ;(error as any).code = 'MODULE_NOT_FOUND'
    throw error
  }

  // actually resolve
  // Search in the root directory first, and fallback to the default require paths.
  return _require.resolve(id, { paths: [root, _dirname] })
}

export function emptyCssComments(raw: string): string {
  return raw.replace(multilineCommentsRE, blankReplacer)
}

function backwardCompatibleWorkerPlugins(plugins: any) {
  if (Array.isArray(plugins)) {
    return plugins
  }
  if (typeof plugins === 'function') {
    return plugins()
  }
  return []
}

type DeepWritable<T> =
  T extends ReadonlyArray<unknown>
    ? { -readonly [P in keyof T]: DeepWritable<T[P]> }
    : T extends RegExp
      ? RegExp
      : T[keyof T] extends Function
        ? T
        : { -readonly [P in keyof T]: DeepWritable<T[P]> }

function deepClone<T>(value: T): DeepWritable<T> {
  if (Array.isArray(value)) {
    return value.map((v) => deepClone(v)) as DeepWritable<T>
  }
  if (isObject(value)) {
    const cloned: Record<string, any> = {}
    for (const key in value) {
      cloned[key] = deepClone(value[key])
    }
    return cloned as DeepWritable<T>
  }
  if (typeof value === 'function') {
    return value as DeepWritable<T>
  }
  if (value instanceof RegExp) {
    return structuredClone(value) as DeepWritable<T>
  }
  if (typeof value === 'object' && value != null) {
    throw new Error('Cannot deep clone non-plain object')
  }
  return value as DeepWritable<T>
}

type MaybeFallback<D, V> = undefined extends V ? Exclude<V, undefined> | D : V

type MergeWithDefaultsResult<D, V> =
  Equal<D, undefined> extends true
    ? V
    : D extends Function | Array<any>
      ? MaybeFallback<D, V>
      : V extends Function | Array<any>
        ? MaybeFallback<D, V>
        : D extends Record<string, any>
          ? V extends Record<string, any>
            ? {
                [K in keyof D | keyof V]: K extends keyof D
                  ? K extends keyof V
                    ? MergeWithDefaultsResult<D[K], V[K]>
                    : D[K]
                  : K extends keyof V
                    ? V[K]
                    : never
              }
            : MaybeFallback<D, V>
          : MaybeFallback<D, V>

function mergeWithDefaultsRecursively<
  D extends Record<string, any>,
  V extends Record<string, any>,
>(defaults: D, values: V): MergeWithDefaultsResult<D, V> {
  const merged: Record<string, any> = defaults
  for (const key in values) {
    const value = values[key]
    // let null to set the value (e.g. `server.watch: null`)
    if (value === undefined) continue

    const existing = merged[key]
    if (existing === undefined) {
      merged[key] = value
      continue
    }

    if (isObject(existing) && isObject(value)) {
      merged[key] = mergeWithDefaultsRecursively(existing, value)
      continue
    }

    // use replace even for arrays
    merged[key] = value
  }
  return merged as MergeWithDefaultsResult<D, V>
}

export function mergeWithDefaults<
  D extends Record<string, any>,
  V extends Record<string, any>,
>(defaults: D, values: V): MergeWithDefaultsResult<DeepWritable<D>, V> {
  // NOTE: we need to clone the value here to avoid mutating the defaults
  const clonedDefaults = deepClone(defaults)
  return mergeWithDefaultsRecursively(clonedDefaults, values)
}

function mergeConfigRecursively(
  defaults: Record<string, any>,
  overrides: Record<string, any>,
  rootPath: string,
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
      (rootPath === 'ssr' || rootPath === 'resolve') &&
      (existing === true || value === true)
    ) {
      merged[key] = true
      continue
    } else if (key === 'plugins' && rootPath === 'worker') {
      merged[key] = () => [
        ...backwardCompatibleWorkerPlugins(existing),
        ...backwardCompatibleWorkerPlugins(value),
      ]
      continue
    } else if (key === 'server' && rootPath === 'server.hmr') {
      merged[key] = value
      continue
    }

    if (Array.isArray(existing) || Array.isArray(value)) {
      merged[key] = [...arraify(existing), ...arraify(value)]
      continue
    }
    if (isObject(existing) && isObject(value)) {
      merged[key] = mergeConfigRecursively(
        existing,
        value,
        rootPath ? `${rootPath}.${key}` : key,
      )
      continue
    }

    merged[key] = value
  }
  return merged
}

export function mergeConfig<
  D extends Record<string, any>,
  O extends Record<string, any>,
>(
  defaults: D extends Function ? never : D,
  overrides: O extends Function ? never : O,
  isRoot = true,
): Record<string, any> {
  if (typeof defaults === 'function' || typeof overrides === 'function') {
    throw new Error(`Cannot merge config in form of callback`)
  }

  return mergeConfigRecursively(defaults, overrides, isRoot ? '' : '.')
}

export function mergeAlias(
  a?: AliasOptions,
  b?: AliasOptions,
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
          replacement: (o as any)[find],
        }),
      )
}

// https://github.com/vitejs/vite/issues/1363
// work around https://github.com/rollup/plugins/issues/759
function normalizeSingleAlias({
  find,
  replacement,
  customResolver,
}: Alias): Alias {
  if (
    typeof find === 'string' &&
    find[find.length - 1] === '/' &&
    replacement[replacement.length - 1] === '/'
  ) {
    find = find.slice(0, find.length - 1)
    replacement = replacement.slice(0, replacement.length - 1)
  }

  const alias: Alias = {
    find,
    replacement,
  }
  if (customResolver) {
    alias.customResolver = customResolver
  }
  return alias
}

/**
 * Transforms transpiled code result where line numbers aren't altered,
 * so we can skip sourcemap generation during dev
 */
export function transformStableResult(
  s: MagicString,
  id: string,
  config: ResolvedConfig,
): TransformResult {
  return {
    code: s.toString(),
    map:
      config.command === 'build' && config.build.sourcemap
        ? s.generateMap({ hires: 'boundary', source: id })
        : null,
  }
}

type AsyncFlatten<T extends unknown[]> = T extends (infer U)[]
  ? Exclude<Awaited<U>, U[]>[]
  : never

export async function asyncFlatten<T extends unknown[]>(
  arr: T,
): Promise<AsyncFlatten<T>> {
  do {
    arr = (await Promise.all(arr)).flat(Infinity) as any
  } while (arr.some((v: any) => v?.then))
  return arr as unknown[] as AsyncFlatten<T>
}

// strip UTF-8 BOM
export function stripBomTag(content: string): string {
  if (content.charCodeAt(0) === 0xfeff) {
    return content.slice(1)
  }

  return content
}

const windowsDrivePathPrefixRE = /^[A-Za-z]:[/\\]/

/**
 * path.isAbsolute also returns true for drive relative paths on windows (e.g. /something)
 * this function returns false for them but true for absolute paths (e.g. C:/something)
 */
export const isNonDriveRelativeAbsolutePath = (p: string): boolean => {
  if (!isWindows) return p[0] === '/'
  return windowsDrivePathPrefixRE.test(p)
}

/**
 * Determine if a file is being requested with the correct case, to ensure
 * consistent behavior between dev and prod and across operating systems.
 */
export function shouldServeFile(filePath: string, root: string): boolean {
  // can skip case check on Linux
  if (!isCaseInsensitiveFS) return true

  return hasCorrectCase(filePath, root)
}

/**
 * Note that we can't use realpath here, because we don't want to follow
 * symlinks.
 */
function hasCorrectCase(file: string, assets: string): boolean {
  if (file === assets) return true

  const parent = path.dirname(file)

  if (fs.readdirSync(parent).includes(path.basename(file))) {
    return hasCorrectCase(parent, assets)
  }

  return false
}

export function joinUrlSegments(a: string, b: string): string {
  if (!a || !b) {
    return a || b || ''
  }
  if (a[a.length - 1] === '/') {
    a = a.substring(0, a.length - 1)
  }
  if (b[0] !== '/') {
    b = '/' + b
  }
  return a + b
}

export function removeLeadingSlash(str: string): string {
  return str[0] === '/' ? str.slice(1) : str
}

export function stripBase(path: string, base: string): string {
  if (path === base) {
    return '/'
  }
  const devBase = withTrailingSlash(base)
  return path.startsWith(devBase) ? path.slice(devBase.length - 1) : path
}

export function arrayEqual(a: any[], b: any[]): boolean {
  if (a === b) return true
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

export function evalValue<T = any>(rawValue: string): T {
  const fn = new Function(`
    var console, exports, global, module, process, require
    return (\n${rawValue}\n)
  `)
  return fn()
}

export function getNpmPackageName(importPath: string): string | null {
  const parts = importPath.split('/')
  if (parts[0][0] === '@') {
    if (!parts[1]) return null
    return `${parts[0]}/${parts[1]}`
  } else {
    return parts[0]
  }
}

export function getPkgName(name: string): string | undefined {
  return name[0] === '@' ? name.split('/')[1] : name
}

const escapeRegexRE = /[-/\\^$*+?.()|[\]{}]/g
export function escapeRegex(str: string): string {
  return str.replace(escapeRegexRE, '\\$&')
}

type CommandType = 'install' | 'uninstall' | 'update'
export function getPackageManagerCommand(
  type: CommandType = 'install',
): string {
  const packageManager =
    process.env.npm_config_user_agent?.split(' ')[0].split('/')[0] || 'npm'
  switch (type) {
    case 'install':
      return packageManager === 'npm' ? 'npm install' : `${packageManager} add`
    case 'uninstall':
      return packageManager === 'npm'
        ? 'npm uninstall'
        : `${packageManager} remove`
    case 'update':
      return packageManager === 'yarn'
        ? 'yarn upgrade'
        : `${packageManager} update`
    default:
      throw new TypeError(`Unknown command type: ${type}`)
  }
}

export function isDevServer(
  server: ViteDevServer | PreviewServer,
): server is ViteDevServer {
  return 'pluginContainer' in server
}

export function createSerialPromiseQueue<T>(): {
  run(f: () => Promise<T>): Promise<T>
} {
  let previousTask: Promise<[unknown, Awaited<T>]> | undefined

  return {
    async run(f) {
      const thisTask = f()
      // wait for both the previous task and this task
      // so that this function resolves in the order this function is called
      const depTasks = Promise.all([previousTask, thisTask])
      previousTask = depTasks

      const [, result] = await depTasks

      // this task was the last one, clear `previousTask` to free up memory
      if (previousTask === depTasks) {
        previousTask = undefined
      }

      return result
    },
  }
}

export function sortObjectKeys<T extends Record<string, any>>(obj: T): T {
  const sorted: Record<string, any> = {}
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = obj[key]
  }
  return sorted as T
}

export function displayTime(time: number): string {
  // display: {X}ms
  if (time < 1000) {
    return `${time}ms`
  }

  time = time / 1000

  // display: {X}s
  if (time < 60) {
    return `${time.toFixed(2)}s`
  }

  // Calculate total minutes and remaining seconds
  const mins = Math.floor(time / 60)
  const seconds = Math.round(time % 60)

  // Handle case where seconds rounds to 60
  if (seconds === 60) {
    return `${mins + 1}m`
  }

  // display: {X}m {Y}s
  return `${mins}m${seconds < 1 ? '' : ` ${seconds}s`}`
}

/**
 * Encodes the URI path portion (ignores part after ? or #)
 */
export function encodeURIPath(uri: string): string {
  if (uri.startsWith('data:')) return uri
  const filePath = cleanUrl(uri)
  const postfix = filePath !== uri ? uri.slice(filePath.length) : ''
  return encodeURI(filePath) + postfix
}

/**
 * Like `encodeURIPath`, but only replacing `%` as `%25`. This is useful for environments
 * that can handle un-encoded URIs, where `%` is the only ambiguous character.
 */
export function partialEncodeURIPath(uri: string): string {
  if (uri.startsWith('data:')) return uri
  const filePath = cleanUrl(uri)
  const postfix = filePath !== uri ? uri.slice(filePath.length) : ''
  return filePath.replaceAll('%', '%25') + postfix
}

type SigtermCallback = (signal?: 'SIGTERM', exitCode?: number) => Promise<void>

// Use a shared callback when attaching sigterm listeners to avoid `MaxListenersExceededWarning`
const sigtermCallbacks = new Set<SigtermCallback>()
const parentSigtermCallback: SigtermCallback = async (signal, exitCode) => {
  await Promise.all([...sigtermCallbacks].map((cb) => cb(signal, exitCode)))
}

export const setupSIGTERMListener = (
  callback: (signal?: 'SIGTERM', exitCode?: number) => Promise<void>,
): void => {
  if (sigtermCallbacks.size === 0) {
    process.once('SIGTERM', parentSigtermCallback)
    if (process.env.CI !== 'true') {
      process.stdin.on('end', parentSigtermCallback)
    }
  }
  sigtermCallbacks.add(callback)
}

export const teardownSIGTERMListener = (
  callback: Parameters<typeof setupSIGTERMListener>[0],
): void => {
  sigtermCallbacks.delete(callback)
  if (sigtermCallbacks.size === 0) {
    process.off('SIGTERM', parentSigtermCallback)
    if (process.env.CI !== 'true') {
      process.stdin.off('end', parentSigtermCallback)
    }
  }
}
