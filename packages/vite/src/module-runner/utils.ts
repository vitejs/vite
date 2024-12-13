import * as pathe from 'pathe'
import { isWindows, slash } from '../shared/utils'

export function normalizeAbsoluteUrl(url: string, root: string): string {
  url = slash(url)

  // file:///C:/root/id.js -> C:/root/id.js
  if (url.startsWith('file://')) {
    // 8 is the length of "file:///"
    url = decodeURI(url.slice(isWindows ? 8 : 7))
  }

  // strip root from the URL because fetchModule prefers a public served url path
  // packages/vite/src/node/server/moduleGraph.ts:17
  if (url.startsWith(root)) {
    // /root/id.js -> /id.js
    // C:/root/id.js -> /id.js
    // 1 is to keep the leading slash
    url = url.slice(root.length - 1)
  }

  return url
}

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
