import type { Connect } from 'dep-types/connect'
import type { ViteDevServer } from '..'
import { joinUrlSegments } from '../../utils'

// this middleware is only active when (config.base !== '/')

export function baseMiddleware({
  config
}: ViteDevServer): Connect.NextHandleFunction {
  const devBase = config.base.endsWith('/') ? config.base : config.base + '/'

  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteBaseMiddleware(req, res, next) {
    const url = req.url!
    const parsed = new URL(url, 'http://vitejs.dev')
    const path = parsed.pathname || '/'

    if (path.startsWith(devBase)) {
      // rewrite url to remove base. this ensures that other middleware does
      // not need to consider base being prepended or not
      req.url = url.replace(devBase, '/')
      return next()
    }

    // skip redirect and error fallback on middleware mode, #4057
    if (config.server.middlewareMode) {
      return next()
    }

    if (path === '/' || path === '/index.html') {
      // redirect root visit to based url with search and hash
      res.writeHead(302, {
        Location: config.base + (parsed.search || '') + (parsed.hash || '')
      })
      res.end()
      return
    } else if (req.headers.accept?.includes('text/html')) {
      // non-based page visit
      const redirectPath = joinUrlSegments(config.base, url)
      res.writeHead(404, {
        'Content-Type': 'text/html'
      })
      res.end(
        `The server is configured with a public base URL of ${config.base} - ` +
          `did you mean to visit <a href="${redirectPath}">${redirectPath}</a> instead?`
      )
      return
    }

    next()
  }
}
