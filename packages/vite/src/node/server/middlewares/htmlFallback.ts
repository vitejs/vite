import fs from 'node:fs'
import path from 'node:path'
import history from 'connect-history-api-fallback'
import type { Connect } from 'dep-types/connect'
import { createDebugger } from '../../utils'

export function htmlFallbackMiddleware(
  root: string,
  spaFallback: boolean
): Connect.NextHandleFunction {
  const historyHtmlFallbackMiddleware = history({
    logger: createDebugger('vite:html-fallback'),
    // support /dir/ without explicit index.html
    rewrites: [
      {
        from: /\/$/,
        to({ parsedUrl }: any) {
          const decodedUrl = decodeURIComponent(parsedUrl.pathname)
          const rewritten = decodedUrl + 'index.html'

          if (fs.existsSync(path.join(root, rewritten))) {
            return rewritten
          } else {
            if (spaFallback) {
              return `/index.html`
            } else {
              // multi-page app, get the corresponding folder name from the path
              // and concatenate it with `/index.html`
              const secondSlashIndex = decodedUrl.indexOf('/', 1)
              return decodedUrl.slice(0, secondSlashIndex) + '/index.html'
            }
          }
        }
      }
    ]
  })

  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteHtmlFallbackMiddleware(req, res, next) {
    return historyHtmlFallbackMiddleware(req, res, next)
  }
}
