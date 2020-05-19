import postcssUrl from 'postcss-url'

type PostcssUrl = typeof postcssUrl

export function replaceStyleUrl(css: string, ctxPath: string): string {
  const postcss = require('postcss')
  const url = require('url')
  return postcss([
    (require('postcss-url') as PostcssUrl)({
      url: (asset) => {
        // absolute path
        if (url.parse(asset.url).protocol || asset.url.startsWith('/')) {
          return asset.url
        }
        // relative path
        return `${ctxPath}/../${asset.url}`
      }
    })
  ]).process(css).css
}
