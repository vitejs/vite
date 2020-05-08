import { Context } from 'koa'
import path from 'path'
import slash from 'slash'

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
