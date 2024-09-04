import { NULL_BYTE_PLACEHOLDER, VALID_ID_PREFIX } from './constants'

export const isWindows =
  typeof process !== 'undefined' && process.platform === 'win32'

/**
 * Prepend `/@id/` and replace null byte so the id is URL-safe.
 * This is prepended to resolved ids that are not valid browser
 * import specifiers by the importAnalysis plugin.
 */
export function wrapId(id: string): string {
  return id.startsWith(VALID_ID_PREFIX)
    ? id
    : VALID_ID_PREFIX + id.replace('\0', NULL_BYTE_PLACEHOLDER)
}

/**
 * Undo {@link wrapId}'s `/@id/` and null byte replacements.
 */
export function unwrapId(id: string): string {
  return id.startsWith(VALID_ID_PREFIX)
    ? id.slice(VALID_ID_PREFIX.length).replace(NULL_BYTE_PLACEHOLDER, '\0')
    : id
}

const windowsSlashRE = /\\/g
export function slash(p: string): string {
  return p.replace(windowsSlashRE, '/')
}

const postfixRE = /[?#].*$/
export function cleanUrl(url: string): string {
  return url.replace(postfixRE, '')
}

export function isPrimitive(value: unknown): boolean {
  return !value || (typeof value !== 'object' && typeof value !== 'function')
}

export function withTrailingSlash(path: string): string {
  if (path[path.length - 1] !== '/') {
    return `${path}/`
  }
  return path
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const AsyncFunction = async function () {}.constructor as typeof Function

// https://github.com/nodejs/node/issues/43047#issuecomment-1564068099
export const asyncFunctionDeclarationPaddingLineCount =
  /** #__PURE__ */ (() => {
    const body = '/*code*/'
    const source = new AsyncFunction('a', 'b', body).toString()
    return source.slice(0, source.indexOf(body)).split('\n').length - 1
  })()

const replacePercentageRE = /%/g

/**
 * Serialize a map into a query string while ensuring order of keys.
 */
function stringifyQueryMap(map: Map<string, string>) {
  const keys = Array.from(map.keys()).sort()
  return keys
    .map((key) => {
      const val = map.get(key)
      return val ? `${key}=${encodeURIComponent(val)}` : key
    })
    .join('&')
}

/**
 * Modify the url by adding or updating query parameters
 * NOTE:
 * - Duplicated keys will only retain the last one
 * - Keys are sorted alphabetically
 *
 * @param url - a complete or incomplete url
 * @param queryToInject query params object or query string (`{ foo: 1 }` or `foo=1`)
 */
export function injectQuery(
  url: string,
  queryToInject: Record<string, string | number> | string,
): string {
  const appendQueryMap = new Map(
    typeof queryToInject === 'string'
      ? new URLSearchParams(queryToInject)
      : Object.entries(queryToInject),
  )
  // encode percents for consistent behavior with pathToFileURL
  // see #2614 for details
  const resolvedUrl = new URL(
    url.replace(replacePercentageRE, '%25'),
    'https://vitejs.dev',
  )
  // URLSearchParams to a `key=>value` object
  // Notice that if you encounter duplicate keys in query parameters (a=3&a=4),
  // only the last occurrence will retain
  const queryMap = new Map(resolvedUrl.searchParams)
  appendQueryMap.forEach((value, key) => {
    queryMap.set(key, String(value ?? ''))
  })

  const { hash } = resolvedUrl
  let pathname = cleanUrl(url)
  pathname = isWindows ? slash(pathname) : pathname
  return `${pathname}?${stringifyQueryMap(queryMap)}${hash ?? ''}`
}
