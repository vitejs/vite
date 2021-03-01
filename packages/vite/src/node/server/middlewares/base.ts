import { Connect } from 'types/connect'
import { parse as parseUrl } from 'url'

// this middleware is only active when (config.base !== '/')

export function baseMiddleware(base: string): Connect.NextHandleFunction {
  return (req, res, next) => {
    const url = req.url!
    const parsed = parseUrl(url)
    const path = parsed.pathname || '/'

    if (path.startsWith(base)) {
      // rewrite url to remove base.. this ensures that other middleware does
      // not need to consider base being prepended or not
      req.url = url.replace(base, '/')
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
