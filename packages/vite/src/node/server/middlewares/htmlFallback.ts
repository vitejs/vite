import fs from 'node:fs'
import path from 'node:path'
import history from 'connect-history-api-fallback'
import type { Connect } from 'dep-types/connect'
import { createDebugger } from '../../utils'

export function htmlFallbackMiddleware(
  root: string,
  spaFallback: boolean,
): Connect.NextHandleFunction {
  const historyHtmlFallbackMiddleware = history({
    disableDotRule: true,
    logger: createDebugger('vite:html-fallback'),
    rewrites: [
      // support /dir/ without explicit index.html
      {
        from: /\/$/,
        to({ parsedUrl, request }: any) {
          const rewritten =
            decodeURIComponent(parsedUrl.pathname) + 'index.html'

          if (fs.existsSync(path.join(root, rewritten))) {
            return rewritten
          }

          return spaFallback ? `/index.html` : request.url
        },
      },
      {
        from: /\.html$/,
        to({ parsedUrl, request }: any) {
          // .html files are not handled by serveStaticMiddleware
          // so we need to check if the file exists
          const pathname = decodeURIComponent(parsedUrl.pathname)
          if (fs.existsSync(path.join(root, pathname))) {
            return request.url
          }
          return '/index.html'
        },
      },
    ],
  })

  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteHtmlFallbackMiddleware(req, res, next) {
    return historyHtmlFallbackMiddleware(req, res, next)
  }
}
