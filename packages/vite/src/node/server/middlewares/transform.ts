import { ViteDevServer } from '..'
import { Connect } from 'types/connect'
import {
  cleanUrl,
  createDebugger,
  injectQuery,
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
import {
  DEP_CACHE_DIR,
  DEP_VERSION_RE,
  NULL_BYTE_PLACEHOLDER,
  VALID_ID_PREFIX
} from '../../constants'
import { pendingDepId } from '../../plugins/resolve'
import { isCSSRequest, isDirectCSSRequest } from '../../plugins/css'

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
    if (
      req.method !== 'GET' ||
      req.headers.accept?.includes('text/html') ||
      knownIgnoreList.has(req.url!)
    ) {
      return next()
    }

    if (server._pendingReload && req.url!.endsWith(pendingDepId)) {
      // missing dep pending reload, hold request
      server._pendingReload.then(() => res.end())
      return
    }

    let url = decodeURI(removeTimestampQuery(req.url!)).replace(
      NULL_BYTE_PLACEHOLDER,
      '\0'
    )
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
          return next()
        }
      }

      // warn explicit /public/ paths
      if (url.startsWith('/public/')) {
        logger.warn(
          chalk.yellow(
            `files in the public directory are served at the root path.\n` +
              `Instead of ${chalk.cyan(url)}, use ${chalk.cyan(
                url.replace(/^\/public\//, '/')
              )}.`
          )
        )
      }

      if (
        isJSRequest(url) ||
        isImportRequest(url) ||
        isCSSRequest(url) ||
        isHTMLProxy(url)
      ) {
        // strip ?import
        url = removeImportQuery(url)

        // Strip valid id prefix. This is preprended to resolved Ids that are
        // not valid browser import specifiers by the importAnalysis plugin.
        if (url.startsWith(VALID_ID_PREFIX)) {
          url = url.slice(VALID_ID_PREFIX.length)
        }

        // for CSS, we need to differentiate between normal CSS requests and
        // imports
        if (isCSSRequest(url) && req.headers.accept?.includes('text/css')) {
          url = injectQuery(url, 'direct')
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
          const type = isDirectCSSRequest(url) ? 'css' : 'js'
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
