import { Context } from 'koa'
import path from 'path'
import slash from 'slash'
import qs from 'querystring'

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
