import { parse as parseUrl } from 'url'
import { ViteDevServer } from '..'
import { Connect } from 'types/connect'

// this middleware is only active when (config.base !== '/')

export function baseMiddleware({
  config
}: ViteDevServer): Connect.NextHandleFunction {
  const base = config.base

  return (req, res, next) => {
    const url = req.url!
    const parsed = parseUrl(url)
    const path = parsed.pathname || '/'

    if (path.startsWith(base)) {
      // rewrite url to remove base.. this ensures that other middleware does not need to consider base being prepended or not
      req.url = url.replace(base, '/')
    } else if (path === '/' || path === '/index.html') {
      // to prevent confusion, do not allow access at / if we have specified a base path
      res.statusCode = 404
      res.end()
      return
    }

    next()
  }
}
