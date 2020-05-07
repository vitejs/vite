import { Context } from 'koa'

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
 * Check if a request is an import from js (instead of fetch() or ajax requests)
 * A request qualifies as long as it's not from page (no ext or .html).
 * this is because non-js files can be transformed into js and import json
 * as well.
 */
export const isImportRequest = (ctx: Context) => {
  const referer = cleanUrl(ctx.get('referer'))
  return /\.\w+$/.test(referer) && !referer.endsWith('.html')
}

export const queryRE = /\?.*$/
export const hashRE = /\#.*$/

export const cleanUrl = (url: string) =>
  url.replace(hashRE, '').replace(queryRE, '')
