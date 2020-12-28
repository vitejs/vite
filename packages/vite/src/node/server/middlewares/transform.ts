import { ViteDevServer } from '..'
import { Connect } from 'types/connect'
import { isCSSProxy, isCSSRequest } from '../../plugins/css'
import {
  cleanUrl,
  createDebugger,
  isImportRequest,
  isJSRequest,
  prettifyUrl,
  removeImportQuery,
  removeTimestampQuery
} from '../../utils'
import { send } from '../send'
import { transformRequest } from '../transformRequest'
import { isHTMLProxy } from '../../plugins/html'
import chalk from 'chalk'
import { DEP_CACHE_DIR, DEP_VERSION_RE } from '../../constants'

const debugCache = createDebugger('vite:cache')
const isDebug = !!process.env.DEBUG

const knownIgnoreList = new Set(['/', '/favicon.ico'])

export function transformMiddleware(
  server: ViteDevServer
): Connect.NextHandleFunction {
  const {
    config: { root, logger },
    moduleGraph
  } = server

  return async (req, res, next) => {
    let url = removeTimestampQuery(req.url!)
    if (req.method !== 'GET' || knownIgnoreList.has(req.url!)) {
      return next()
    }

    const withoutQuery = cleanUrl(url)

    try {
      const isSourceMap = withoutQuery.endsWith('.map')
      // since we generate source map references, handle those requests here
      if (isSourceMap) {
        const originalUrl = url.replace(/\.map($|\?)/, '$1')
        const map = (await moduleGraph.getModuleByUrl(originalUrl))
          ?.transformResult?.map
        if (map) {
          return send(req, res, JSON.stringify(map), 'json')
        } else {
          res.statusCode = 404
          return res.end()
        }
      }

      // warn explicit /public/ paths
      if (url.startsWith('/public/')) {
        logger.warn(
          chalk.yellow(
            `[vite] files in the public directory are served at the root path.\n` +
              `Instead of ${chalk.cyan(url)}, use ${chalk.cyan(
                url.replace(/^\/public\//, '/')
              )}.`
          )
        )
      }

      // Only apply the transform pipeline to:
      // - requests that initiate from ESM imports (any extension)
      // - CSS (even not from ESM)
      // - Source maps (only for resolving)
      if (
        isJSRequest(url) ||
        isImportRequest(url) ||
        isCSSRequest(url) ||
        isHTMLProxy(url) ||
        server.config.transformInclude(withoutQuery)
      ) {
        // strip ?import except for CSS since we need to differentiate between
        // normal CSS requests and imports
        if (!isCSSProxy(url)) {
          url = removeImportQuery(url)
        }

        // check if we can return 304 early
        const ifNoneMatch = req.headers['if-none-match']
        if (
          ifNoneMatch &&
          (await moduleGraph.getModuleByUrl(url))?.transformResult?.etag ===
            ifNoneMatch
        ) {
          isDebug && debugCache(`[304] ${prettifyUrl(url, root)}`)
          res.statusCode = 304
          return res.end()
        }

        // resolve, load and transform using the plugin container
        const result = await transformRequest(url, server)
        if (result) {
          const type = isCSSRequest(url) ? 'css' : 'js'
          const isDep =
            DEP_VERSION_RE.test(url) ||
            url.includes(`node_modules/${DEP_CACHE_DIR}`)
          return send(
            req,
            res,
            result.code,
            type,
            result.etag,
            // allow browser to cache npm deps!
            isDep ? 'max-age=31536000,immutable' : 'no-cache',
            result.map
          )
        }
      }
    } catch (e) {
      return next(e)
    }

    next()
  }
}
