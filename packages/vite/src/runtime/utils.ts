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

export function posixDirname(filepath: string): string {
  const normalizedPath = filepath.endsWith('/')
    ? filepath.substring(0, filepath.length - 1)
    : filepath
  return normalizedPath.substring(0, normalizedPath.lastIndexOf('/')) || '/'
}

export function toWindowsPath(path: string): string {
  return path.replace(/\//g, '\\')
}

// inlined from pathe to support environments without access to node:path
function cwd(): string {
  if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
    return slash(process.cwd())
  }
  return '/'
}

export function posixResolve(...segments: string[]): string {
  // Normalize windows arguments
  segments = segments.map((argument) => slash(argument))

  let resolvedPath = ''
  let resolvedAbsolute = false

  for (
    let index = segments.length - 1;
    index >= -1 && !resolvedAbsolute;
    index--
  ) {
    const path = index >= 0 ? segments[index] : cwd()

    // Skip empty entries
    if (!path || path.length === 0) {
      continue
    }

    resolvedPath = `${path}/${resolvedPath}`
    resolvedAbsolute = isAbsolute(path)
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute)

  if (resolvedAbsolute && !isAbsolute(resolvedPath)) {
    return `/${resolvedPath}`
  }

  return resolvedPath.length > 0 ? resolvedPath : '.'
}

const _IS_ABSOLUTE_RE = /^[/\\](?![/\\])|^[/\\]{2}(?!\.)|^[A-Za-z]:[/\\]/

function isAbsolute(p: string): boolean {
  return _IS_ABSOLUTE_RE.test(p)
}

// Resolves . and .. elements in a path with directory names
export function normalizeString(path: string, allowAboveRoot: boolean): string {
  let res = ''
  let lastSegmentLength = 0
  let lastSlash = -1
  let dots = 0
  let char: string | null = null
  for (let index = 0; index <= path.length; ++index) {
    if (index < path.length) {
      char = path[index]
    } else if (char === '/') {
      break
    } else {
      char = '/'
    }
    if (char === '/') {
      if (lastSlash === index - 1 || dots === 1) {
        // NOOP
      } else if (dots === 2) {
        if (
          res.length < 2 ||
          lastSegmentLength !== 2 ||
          res[res.length - 1] !== '.' ||
          res[res.length - 2] !== '.'
        ) {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf('/')
            if (lastSlashIndex === -1) {
              res = ''
              lastSegmentLength = 0
            } else {
              res = res.slice(0, lastSlashIndex)
              lastSegmentLength = res.length - 1 - res.lastIndexOf('/')
            }
            lastSlash = index
            dots = 0
            continue
          } else if (res.length > 0) {
            res = ''
            lastSegmentLength = 0
            lastSlash = index
            dots = 0
            continue
          }
        }
        if (allowAboveRoot) {
          res += res.length > 0 ? '/..' : '..'
          lastSegmentLength = 2
        }
      } else {
        if (res.length > 0) {
          res += `/${path.slice(lastSlash + 1, index)}`
        } else {
          res = path.slice(lastSlash + 1, index)
        }
        lastSegmentLength = index - lastSlash - 1
      }
      lastSlash = index
      dots = 0
    } else if (char === '.' && dots !== -1) {
      ++dots
    } else {
      dots = -1
    }
  }
  return res
}
