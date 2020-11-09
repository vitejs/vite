import slash from 'slash'
import querystring from 'querystring'
import qs, { ParsedUrlQuery } from 'querystring'
import resolve from 'resolve'
import { supportedExts } from '../resolver'
import { Context } from '../server'

let isRunningWithYarnPnp: boolean = false
try {
  isRunningWithYarnPnp = Boolean(require('pnpapi'))
} catch {}

export const resolveFrom = (root: string, id: string) => {
  // console.log(`resolveFrom '${path.relative(process.cwd(), root)}' to '${id}'`)
  return resolve.sync(id, {
    basedir: root,
    extensions: supportedExts,
    // necessary to work with pnpm
    preserveSymlinks: isRunningWithYarnPnp || false
  })
}

export const queryRE = /\?.*$/
export const hashRE = /#.*$/

export const cleanUrl = (url: string) =>
  url.replace(hashRE, '').replace(queryRE, '')

export const parseWithQuery = (
  id: string
): {
  path: string
  query: ParsedUrlQuery
} => {
  const queryMatch = id.match(queryRE)
  if (queryMatch) {
    return {
      path: slash(cleanUrl(id)),
      query: qs.parse(queryMatch[0].slice(1))
    }
  }
  return {
    path: cleanUrl(id),
    query: {}
  }
}
export const bareImportRE = /^[^\/\.]/

const externalRE = /^(https?:)?\/\//
export const isExternalUrl = (url: string) => externalRE.test(url)

const dataUrlRE = /^\s*data:/i
export const isDataUrl = (url: string) => dataUrlRE.test(url)

const imageRE = /\.(png|jpe?g|gif|svg|ico|webp)(\?.*)?$/
const mediaRE = /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/
const fontsRE = /\.(woff2?|eot|ttf|otf)(\?.*)?$/i

/**
 * Check if a file is a static asset that vite can process.
 */
export const isStaticAsset = (file: string) => {
  return imageRE.test(file) || mediaRE.test(file) || fontsRE.test(file)
}

/**
 * Check if a request is an import from js instead of a native resource request
 * i.e. differentiate
 * `import('/style.css')`
 * from
 * `<link rel="stylesheet" href="/style.css">`
 *
 * The ?import query is injected by serverPluginModuleRewrite.
 */
export const isImportRequest = (ctx: Context): boolean => {
  return ctx.query.import != null
}

export function parseNodeModuleId(id: string) {
  const parts = id.split('/')
  let scope = '',
    name = '',
    inPkgPath = ''
  if (id.startsWith('@')) scope = parts.shift()!
  name = parts.shift()!
  inPkgPath = parts.join('/')
  return {
    scope,
    name,
    inPkgPath
  }
}

export function removeUnRelatedHmrQuery(url: string) {
  const { path, query } = parseWithQuery(url)
  delete query.t
  delete query.import
  if (Object.keys(query).length) {
    return path + '?' + qs.stringify(query)
  }
  return path
}

export function mapQuery(
  url: string,
  mapper: (query: ParsedUrlQuery) => ParsedUrlQuery
) {
  const { path, query } = parseWithQuery(url)
  const newQuery = mapper(query)
  if (Object.keys(newQuery).length) {
    return path + '?' + querystring.encode(newQuery)
  }
  return path
}

export function addStringQuery(url: string, query: string | undefined) {
  if (!query) {
    return url
  }
  if (query.startsWith('?')) {
    query = query.slice(1)
  }
  if (url.includes('?')) {
    return url + '&' + query
  }
  return url + '?' + query
}
