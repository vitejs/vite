import * as pathe from 'pathe'
import { isWindows, slash } from '../shared/utils'

export const decodeBase64 =
  typeof atob !== 'undefined'
    ? atob
    : (str: string) => Buffer.from(str, 'base64').toString('utf-8')

const CHAR_FORWARD_SLASH = 47
const CHAR_BACKWARD_SLASH = 92

const percentRegEx = /%/g
const backslashRegEx = /\\/g
const newlineRegEx = /\n/g
const carriageReturnRegEx = /\r/g
const tabRegEx = /\t/g
const questionRegex = /\?/g
const hashRegex = /#/g

function encodePathChars(filepath: string) {
  if (filepath.indexOf('%') !== -1)
    filepath = filepath.replace(percentRegEx, '%25')
  // In posix, backslash is a valid character in paths:
  if (!isWindows && filepath.indexOf('\\') !== -1)
    filepath = filepath.replace(backslashRegEx, '%5C')
  if (filepath.indexOf('\n') !== -1)
    filepath = filepath.replace(newlineRegEx, '%0A')
  if (filepath.indexOf('\r') !== -1)
    filepath = filepath.replace(carriageReturnRegEx, '%0D')
  if (filepath.indexOf('\t') !== -1)
    filepath = filepath.replace(tabRegEx, '%09')
  return filepath
}

export const posixDirname = pathe.dirname
export const posixResolve = pathe.resolve

export function posixPathToFileHref(posixPath: string): string {
  let resolved = posixResolve(posixPath)
  // path.resolve strips trailing slashes so we must add them back
  const filePathLast = posixPath.charCodeAt(posixPath.length - 1)
  if (
    (filePathLast === CHAR_FORWARD_SLASH ||
      (isWindows && filePathLast === CHAR_BACKWARD_SLASH)) &&
    resolved[resolved.length - 1] !== '/'
  )
    resolved += '/'

  // Call encodePathChars first to avoid encoding % again for ? and #.
  resolved = encodePathChars(resolved)

  // Question and hash character should be included in pathname.
  // Therefore, encoding is required to eliminate parsing them in different states.
  // This is done as an optimization to not creating a URL instance and
  // later triggering pathname setter, which impacts performance
  if (resolved.indexOf('?') !== -1)
    resolved = resolved.replace(questionRegex, '%3F')
  if (resolved.indexOf('#') !== -1)
    resolved = resolved.replace(hashRegex, '%23')
  return new URL(`file://${resolved}`).href
}

export function toWindowsPath(path: string): string {
  return path.replace(/\//g, '\\')
}

// Unique id that is not available as "$bare_import" like "test"
// @see https://nodejs.org/api/modules.html#built-in-modules-with-mandatory-node-prefix
const prefixedBuiltins = new Set([
  'node:sea',
  'node:sqlite',
  'node:test',
  'node:test/reporters',
])

const nodeSliceStart = 5
const fileSliceStart = 5
const multipleSlashRe = /^\/+/

// Cache the OS-specific replacement
const fsSliceStart = isWindows ? 5 : 4

export function normalizeModuleId(file: string): string {
  // For prefixed builtins, return as is it, otherwise remove node: prefix
  if (file.startsWith('node:')) {
    if (prefixedBuiltins.has(file)) {
      return file
    }
    return file.slice(nodeSliceStart)
  }

  let id = slash(file)

  // Replace /@fs/ prefix to "" or "/"
  if (id.startsWith('/@fs/')) {
    id = id.slice(fsSliceStart)
  }

  // Remove file:/ prefix
  if (id.startsWith('file:/')) {
    id = id.slice(fileSliceStart)
  }

  // Normalize multiple leading slashes
  if (id.startsWith('//')) {
    id = id.replace(multipleSlashRe, '/')
  }

  return id
}
