import _debug from 'debug'
import getEtag from 'etag'
import fs, { promises as fsp } from 'fs'
import { SourceDescription, SourceMap } from 'rollup'
import { ServerContext } from '..'
import { NextHandleFunction } from 'connect'
import { isCSSRequest } from '../../plugins/css'
import chalk from 'chalk'
import { cleanUrl } from '../../utils'
import { send } from '../send'

const debugResolve = _debug('vite:resolve')
const debugLoad = _debug('vite:load')
const debugTransform = _debug('vite:transform')
const debugCache = _debug('vite:cache')
const isDebug = !!process.env.DEBUG

export interface TransformResult {
  code: string
  map: SourceMap | null
  etag: string
}

/**
 * Store file -> url mapping information
 * One file may map to multiple urls, e.g. different parts of the Vue SFC
 * maps to the same file after stripping the query params.
 */
const fileToUrlMap = new Map<string, Set<string>>()

export async function transformFile(
  url: string,
  { container, transformCache }: ServerContext
): Promise<TransformResult | null> {
  const cached = transformCache.get(url)
  if (cached) {
    isDebug && debugCache(`transform cache hit for ${url}`)
    return cached
  }

  // resolve
  const resolved = await container.resolveId(url)
  if (!resolved) {
    isDebug && debugResolve(`no resolveId result: ${chalk.cyan(url)}`)
    return null
  }
  const id = resolved.id
  isDebug && debugResolve(`resolve: ${chalk.yellow(url)} -> ${chalk.cyan(id)}`)

  // record file -> url relationships after successful resolve
  const cleanId = cleanUrl(id)
  let urls = fileToUrlMap.get(cleanId)
  if (!urls) {
    urls = new Set<string>()
    fileToUrlMap.set(cleanId, urls)
  }
  urls.add(url)

  let code = ''
  let map: SourceDescription['map'] = null

  // load
  const loadResult = await container.load(id)
  if (loadResult == null) {
    // try fallback loading it from fs as string
    // if the file is a binary, there should be a plugin that already loaded it
    // as string
    if (fs.existsSync(cleanId) && fs.statSync(cleanId).isFile()) {
      code = await fsp.readFile(cleanId, 'utf-8')
    }
  } else if (typeof loadResult === 'object') {
    code = loadResult.code
    map = loadResult.map
  } else {
    code = loadResult
  }
  if (code == null) {
    isDebug && debugLoad(`${chalk.cyan(url)} not loaded`)
    return null
  }
  isDebug && debugLoad(`loaded: ${chalk.yellow(url)}`)

  // transform
  const transformResult = await container.transform(code, id)
  if (
    transformResult == null ||
    (typeof transformResult === 'object' && !transformResult.code)
  ) {
    // no transform applied, keep code as-is
    isDebug && debugTransform(`${chalk.cyan(url)} no transform applied`)
  } else {
    isDebug && debugTransform(`transformed: ${chalk.yellow(url)}`)
    if (typeof transformResult === 'object') {
      code = transformResult.code!
      map = transformResult.map
    } else {
      code = transformResult
    }
  }

  const result = {
    code,
    map,
    etag: getEtag(code, { weak: true })
  } as TransformResult
  transformCache.set(url, result)
  return result
}

export function transformMiddleware(
  context: ServerContext
): NextHandleFunction {
  const { watcher, transformCache } = context

  watcher.on('change', (file) => {
    const urls = fileToUrlMap.get(file)
    if (urls) {
      urls.forEach((url) => {
        debugCache(`busting transform cache for ${url}`)
        transformCache.delete(url)
      })
    }
  })

  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next()
    }

    // check if we can return 304 early
    const ifNoneMatch = req.headers['if-none-match']
    if (ifNoneMatch && transformCache.get(req.url!)?.etag === ifNoneMatch) {
      debugCache(`etag cache hit for ${req.url}`)
      res.statusCode = 304
      return res.end()
    }

    const isSourceMap = req.url!.endsWith('.map')
    const isCSS = isCSSRequest(req.url!)

    // since we generate source map references, handle those requests here
    if (isSourceMap) {
      const originalUrl = req.url!.replace(/\.map$/, '')
      const transformed = transformCache.get(originalUrl)
      if (transformed && transformed.map) {
        return send(
          req,
          res,
          JSON.stringify(transformed.map),
          'applcation/json'
        )
      }
    }

    // we only apply the transform pipeline to:
    // - requests that initiate from ESM imports (any extension)
    // - CSS (even not from ESM)
    // - Source maps (only for resolving)
    if (
      // esm imports accept */* in most browsers
      req.headers['accept'] === '*/*' ||
      req.headers['sec-fetch-dest'] === 'script' ||
      isSourceMap ||
      isCSS
    ) {
      // resolve, load and transform using the plugin container
      try {
        const result = await transformFile(req.url!, context)
        if (result) {
          const type = isCSS ? 'text/css' : 'application/javascript'
          const hasMap = !!(result.map && result.map.mappings)
          return send(req, res, result.code, type, result.etag, hasMap)
        }
      } catch (e) {
        return next(e)
      }
    }

    next()
  }
}
