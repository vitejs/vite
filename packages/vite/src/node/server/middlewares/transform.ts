import getEtag from 'etag'
import fs, { promises as fsp } from 'fs'
import { SourceDescription, SourceMap } from 'rollup'
import { ServerContext } from '..'
import { Connect } from '../../types/connect'
import { isCSSRequest, unwrapCSSProxy } from '../../plugins/css'
import chalk from 'chalk'
import {
  createDebugger,
  cleanUrl,
  prettifyUrl,
  removeTimestampQuery,
  timeFrom
} from '../../utils'
import { send } from '../send'

const debugUrl = createDebugger('vite:url')
const debugLoad = createDebugger('vite:load')
const debugTransform = createDebugger('vite:transform')
const debugCache = createDebugger('vite:cache')
const isDebug = !!process.env.DEBUG

export interface TransformResult {
  code: string
  map: SourceMap | null
  etag: string
}

export async function transformFile(
  url: string,
  { config: { root }, container, moduleGraph }: ServerContext
): Promise<TransformResult | null> {
  url = removeTimestampQuery(url)
  const prettyUrl = isDebug ? prettifyUrl(url, root) : ''

  // check if we have a fresh cache
  const cached = (await moduleGraph.getModuleByUrl(url))?.transformResult
  if (cached) {
    isDebug && debugCache(`[memory] ${prettyUrl}`)
    return cached
  }

  // resolve
  const resolved = await container.resolveId(url)
  if (!resolved) {
    isDebug && debugUrl(`not resolved: ${url}`)
    return null
  }
  const id = resolved.id
  const file = unwrapCSSProxy(cleanUrl(id))
  if (isDebug) {
    // this is only useful when showing the full paths but it can get very
    // spammy so it's disabled by default
    // debugUrl(`${chalk.green(url)} -> ${chalk.dim(id)}`)
  }

  let code = null
  let map: SourceDescription['map'] = null

  // load
  const loadStart = Date.now()
  const loadResult = await container.load(id)
  if (loadResult == null) {
    // try fallback loading it from fs as string
    // if the file is a binary, there should be a plugin that already loaded it
    // as string
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      code = await fsp.readFile(file, 'utf-8')
      isDebug && debugLoad(`${timeFrom(loadStart)} [fs] ${prettyUrl}`)
    }
  } else {
    isDebug && debugLoad(`${timeFrom(loadStart)} [plugin] ${prettyUrl}`)
    if (typeof loadResult === 'object') {
      code = loadResult.code
      map = loadResult.map
    } else {
      code = loadResult
    }
  }
  if (code == null) {
    isDebug && debugLoad(`${chalk.red.bold(`[fail]`)} ${chalk.yellow(id)}`)
    return null
  }

  // create module in graph after successful load
  // it may already exist - in this case we update it with the resolved id.
  const mod = await moduleGraph.ensureEntry(url, id)

  // transform
  const ttransformStart = Date.now()
  const transformResult = await container.transform(code, id)
  if (
    transformResult == null ||
    (typeof transformResult === 'object' && !transformResult.code)
  ) {
    // no transform applied, keep code as-is
    isDebug &&
      debugTransform(
        timeFrom(ttransformStart) + chalk.dim(` [skipped] ${prettyUrl}`)
      )
  } else {
    isDebug && debugTransform(`${timeFrom(ttransformStart)} ${prettyUrl}`)
    if (typeof transformResult === 'object') {
      code = transformResult.code!
      map = transformResult.map
    } else {
      code = transformResult
    }
  }

  return (mod.transformResult = {
    code,
    map,
    etag: getEtag(code, { weak: true })
  } as TransformResult)
}

export function transformMiddleware(
  context: ServerContext
): Connect.NextHandleFunction {
  const {
    config: { root },
    moduleGraph
  } = context

  return async (req, res, next) => {
    if (req.method !== 'GET' || req.url === '/') {
      return next()
    }

    try {
      // check if we can return 304 early
      const ifNoneMatch = req.headers['if-none-match']
      if (
        ifNoneMatch &&
        (await moduleGraph.getModuleByUrl(req.url!))?.transformResult?.etag ===
          ifNoneMatch
      ) {
        isDebug && debugCache(`[304] ${prettifyUrl(req.url!, root)}`)
        res.statusCode = 304
        return res.end()
      }

      const isSourceMap = req.url!.endsWith('.map')
      // since we generate source map references, handle those requests here
      if (isSourceMap) {
        const originalUrl = req.url!.replace(/\.map$/, '')
        const map = (await moduleGraph.getModuleByUrl(originalUrl))
          ?.transformResult?.map
        if (originalUrl.startsWith('/@fs')) debugger
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
        // resolve, load and transform using the plugin container
        const result = await transformFile(req.url!, context)
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
