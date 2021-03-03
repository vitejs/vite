import { parseUrl } from '../../utils'
import { ViteDevServer } from '..'
import { Connect } from 'types/connect'

// this middleware is only active when (config.base !== '/')

export function baseMiddleware({
  config
}: ViteDevServer): Connect.NextHandleFunction {
  const base = config.base.slice(0, -1)

  return (req, res, next) => {
    const url = req.url!
    const parsed = parseUrl(url)
    const path = parsed.pathname || '/'

    if (path.startsWith(base)) {
      // rewrite url to remove base.. this ensures that other middleware does
      // not need to consider base being prepended or not
      req.url = url.replace(new RegExp(`^${base}/?`), '/')
    } else if (path === '/' || path === '/index.html') {
      // redirect root visit to based url
      res.writeHead(302, {
        Location: base
      })
      res.end()
      return
    } else if (req.headers.accept?.includes('text/html')) {
      // non-based page visit
      res.statusCode = 404
      res.end(
        `The server is configured with a public base URL of ${base} - ` +
          `did you mean to visit ${base}${url.slice(1)} instead?`
      )
      return
    }

    next()
  }
}
