import { ViteDevServer } from '..'
import { Connect } from 'types/connect'
import { isCSSRequest } from '../../plugins/css'
import { createDebugger, prettifyUrl } from '../../utils'
import { send } from '../send'
import { transformRequest } from '../transformRequest'

const debugCache = createDebugger('vite:cache')
const isDebug = !!process.env.DEBUG

export function transformMiddleware(
  server: ViteDevServer
): Connect.NextHandleFunction {
  const {
    config: { root },
    moduleGraph
  } = server

  return async (req, res, next) => {
    if (req.method !== 'GET' || req.url === '/') {
      return next()
    }

    try {
      const isSourceMap = req.url!.endsWith('.map')
      // since we generate source map references, handle those requests here
      if (isSourceMap) {
        const originalUrl = req.url!.replace(/\.map$/, '')
        const map = (await moduleGraph.getModuleByUrl(originalUrl))
          ?.transformResult?.map
        if (map) {
          return send(req, res, JSON.stringify(map), 'json')
        }
      }

      // we only apply the transform pipeline to:
      // - requests that initiate from ESM imports (any extension)
      // - CSS (even not from ESM)
      // - Source maps (only for resolving)
      const isCSS = isCSSRequest(req.url!)
      if (
        // esm imports accept */* in most browsers
        req.headers['accept'] === '*/*' ||
        req.headers['sec-fetch-dest'] === 'script' ||
        isSourceMap ||
        isCSS
      ) {
        // check if we can return 304 early
        const ifNoneMatch = req.headers['if-none-match']
        if (
          ifNoneMatch &&
          (await moduleGraph.getModuleByUrl(req.url!))?.transformResult
            ?.etag === ifNoneMatch
        ) {
          isDebug && debugCache(`[304] ${prettifyUrl(req.url!, root)}`)
          res.statusCode = 304
          return res.end()
        }

        // resolve, load and transform using the plugin container
        const result = await transformRequest(req.url!, server)
        if (result) {
          const type = isCSS ? 'css' : 'js'
          const hasMap = !!(result.map && result.map.mappings)
          return send(req, res, result.code, type, result.etag, hasMap)
        }
      }
    } catch (e) {
      return next(e)
    }

    next()
  }
}
