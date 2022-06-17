import { promises as fs } from 'fs'
import path from 'path'
import type { Connect } from 'types/connect'
import colors from 'picocolors'
import type { ViteDevServer } from '..'
import {
  cleanUrl,
  createDebugger,
  ensureVolumeInPath,
  fsPathFromId,
  injectQuery,
  isImportRequest,
  isJSRequest,
  normalizePath,
  prettifyUrl,
  removeImportQuery,
  removeTimestampQuery,
  unwrapId
} from '../../utils'
import { send } from '../send'
import { transformRequest } from '../transformRequest'
import { isHTMLProxy } from '../../plugins/html'
import {
  DEP_VERSION_RE,
  FS_PREFIX,
  NULL_BYTE_PLACEHOLDER
} from '../../constants'
import {
  isCSSRequest,
  isDirectCSSRequest,
  isDirectRequest
} from '../../plugins/css'
import {
  ERR_OPTIMIZE_DEPS_PROCESSING_ERROR,
  ERR_OUTDATED_OPTIMIZED_DEP
} from '../../plugins/optimizedDeps'
import { getDepsOptimizer } from '../../optimizer'

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

  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return async function viteTransformMiddleware(req, res, next) {
    if (req.method !== 'GET' || knownIgnoreList.has(req.url!)) {
      return next()
    }

    let url: string
    try {
      url = decodeURI(removeTimestampQuery(req.url!)).replace(
        NULL_BYTE_PLACEHOLDER,
        '\0'
      )
    } catch (e) {
      return next(e)
    }

    const withoutQuery = cleanUrl(url)

    try {
      const isSourceMap = withoutQuery.endsWith('.map')
      // since we generate source map references, handle those requests here
      if (isSourceMap) {
        if (getDepsOptimizer(server.config)?.isOptimizedDepUrl(url)) {
          // If the browser is requesting a source map for an optimized dep, it
          // means that the dependency has already been pre-bundled and loaded
          const mapFile = url.startsWith(FS_PREFIX)
            ? fsPathFromId(url)
            : normalizePath(
                ensureVolumeInPath(path.resolve(root, url.slice(1)))
              )
          try {
            const map = await fs.readFile(mapFile, 'utf-8')
            return send(req, res, map, 'json', {
              headers: server.config.server.headers
            })
          } catch (e) {
            // Outdated source map request for optimized deps, this isn't an error
            // but part of the normal flow when re-optimizing after missing deps
            // Send back an empty source map so the browser doesn't issue warnings
            const dummySourceMap = {
              version: 3,
              file: mapFile.replace(/\.map$/, ''),
              sources: [],
              sourcesContent: [],
              names: [],
              mappings: ';;;;;;;;;'
            }
            return send(req, res, JSON.stringify(dummySourceMap), 'json', {
              cacheControl: 'no-cache',
              headers: server.config.server.headers
            })
          }
        } else {
          const originalUrl = url.replace(/\.map($|\?)/, '$1')
          const map = (await moduleGraph.getModuleByUrl(originalUrl, false))
            ?.transformResult?.map
          if (map) {
            return send(req, res, JSON.stringify(map), 'json', {
              headers: server.config.server.headers
            })
          } else {
            return next()
          }
        }
      }

      // check if public dir is inside root dir
      const publicDir = normalizePath(server.config.publicDir)
      const rootDir = normalizePath(server.config.root)
      if (publicDir.startsWith(rootDir)) {
        const publicPath = `${publicDir.slice(rootDir.length)}/`
        // warn explicit public paths
        if (url.startsWith(publicPath)) {
          let warning: string

          if (isImportRequest(url)) {
            const rawUrl = removeImportQuery(url)

            warning =
              'Assets in public cannot be imported from JavaScript.\n' +
              `Instead of ${colors.cyan(
                rawUrl
              )}, put the file in the src directory, and use ${colors.cyan(
                rawUrl.replace(publicPath, '/src/')
              )} instead.`
          } else {
            warning =
              `files in the public directory are served at the root path.\n` +
              `Instead of ${colors.cyan(url)}, use ${colors.cyan(
                url.replace(publicPath, '/')
              )}.`
          }

          logger.warn(colors.yellow(warning))
        }
      }

      if (
        isJSRequest(url) ||
        isImportRequest(url) ||
        isCSSRequest(url) ||
        isHTMLProxy(url)
      ) {
        // strip ?import
        url = removeImportQuery(url)
        // Strip valid id prefix. This is prepended to resolved Ids that are
        // not valid browser import specifiers by the importAnalysis plugin.
        url = unwrapId(url)

        // for CSS, we need to differentiate between normal CSS requests and
        // imports
        if (
          isCSSRequest(url) &&
          !isDirectRequest(url) &&
          req.headers.accept?.includes('text/css')
        ) {
          url = injectQuery(url, 'direct')
        }

        // check if we can return 304 early
        const ifNoneMatch = req.headers['if-none-match']
        if (
          ifNoneMatch &&
          (await moduleGraph.getModuleByUrl(url, false))?.transformResult
            ?.etag === ifNoneMatch
        ) {
          isDebug && debugCache(`[304] ${prettifyUrl(url, root)}`)
          res.statusCode = 304
          return res.end()
        }

        // resolve, load and transform using the plugin container
        const result = await transformRequest(url, server, {
          html: req.headers.accept?.includes('text/html')
        })
        if (result) {
          const type = isDirectCSSRequest(url) ? 'css' : 'js'
          const isDep =
            DEP_VERSION_RE.test(url) ||
            getDepsOptimizer(server.config)?.isOptimizedDepUrl(url)
          return send(req, res, result.code, type, {
            etag: result.etag,
            // allow browser to cache npm deps!
            cacheControl: isDep ? 'max-age=31536000,immutable' : 'no-cache',
            headers: server.config.server.headers,
            map: result.map
          })
        }
      }
    } catch (e) {
      if (e?.code === ERR_OPTIMIZE_DEPS_PROCESSING_ERROR) {
        // Skip if response has already been sent
        if (!res.writableEnded) {
          res.statusCode = 504 // status code request timeout
          res.end()
        }
        // This timeout is unexpected
        logger.error(e.message)
        return
      }
      if (e?.code === ERR_OUTDATED_OPTIMIZED_DEP) {
        // Skip if response has already been sent
        if (!res.writableEnded) {
          res.statusCode = 504 // status code request timeout
          res.end()
        }
        // We don't need to log an error in this case, the request
        // is outdated because new dependencies were discovered and
        // the new pre-bundle dependendencies have changed.
        // A full-page reload has been issued, and these old requests
        // can't be properly fullfilled. This isn't an unexpected
        // error but a normal part of the missing deps discovery flow
        return
      }
      return next(e)
    }

    next()
  }
}
