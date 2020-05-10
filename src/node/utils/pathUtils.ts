import { Context } from 'koa'
import path from 'path'
import slash from 'slash'
import qs from 'querystring'
import { InternalResolver } from '../resolver'

export const queryRE = /\?.*$/
export const hashRE = /\#.*$/

export const cleanUrl = (url: string) =>
  url.replace(hashRE, '').replace(queryRE, '')

export const resolveRelativeRequest = (importer: string, id: string) => {
  const resolved = slash(path.posix.resolve(path.dirname(importer), id))
  const queryMatch = id.match(queryRE)
  return {
    url: resolved,
    pathname: cleanUrl(resolved),
    query: queryMatch ? queryMatch[0] : ''
  }
}

export const parseWithQuery = (
  id: string
): {
  path: string
  query: Record<string, string | string[] | undefined>
} => {
  const queryMatch = id.match(queryRE)
  if (queryMatch) {
    return {
      path: slash(cleanUrl(id)),
      query: qs.parse(queryMatch[0].slice(1))
    }
  }
  return {
    path: id,
    query: {}
  }
}

const httpRE = /^https?:\/\//
export const isExternalUrl = (url: string) => httpRE.test(url)

const imageRE = /\.(png|jpe?g|gif|svg|ico)(\?.*)?$/
const mediaRE = /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/
const fontsRE = /\.(woff2?|eot|ttf|otf)(\?.*)?$/i

/**
 * Check if a file is a static asset that vite can process.
 */
export const isStaticAsset = (file: string) => {
  return imageRE.test(file) || mediaRE.test(file) || fontsRE.test(file)
}

const timeStampRE = /(&|\?)t=\d+/
const jsSrcFileRE = /\.(vue|jsx?|tsx?)$/

/**
 * Check if a request is an import from js (instead of fetch() or ajax requests)
 * A request qualifies as long as it's from one of the supported js source file
 * formats (vue,js,ts,jsx,tsx)
 */
export const isImportRequest = (ctx: Context): boolean => {
  if (!ctx.accepts('js')) {
    return false
  }
  // strip HMR timestamps
  const referer = ctx.get('referer').replace(timeStampRE, '')
  return jsSrcFileRE.test(referer)
}

const bareImportRE = /^[^\/\.]/
const fileExtensionRE = /\.\w+$/

export const resolveImport = (
  importer: string,
  id: string,
  resolver: InternalResolver,
  timestamp?: string
): string => {
  id = resolver.alias(id) || id
  if (bareImportRE.test(id)) {
    return `/@modules/${id}`
  } else {
    let { pathname, query } = resolveRelativeRequest(importer, id)
    // append an extension to extension-less imports
    if (!fileExtensionRE.test(pathname)) {
      const file = resolver.requestToFile(pathname)
      const indexMatch = file.match(/\/index\.\w+$/)
      if (indexMatch) {
        pathname = pathname.replace(/\/(index)?$/, '') + indexMatch[0]
      } else {
        pathname += path.extname(file)
      }
    }
    // force re-fetch all imports by appending timestamp
    // if this is a hmr refresh request
    if (timestamp) {
      query += `${query ? `&` : `?`}t=${timestamp}`
    }
    return pathname + query
  }
}
