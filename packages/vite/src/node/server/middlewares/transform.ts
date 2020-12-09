import _debug from 'debug'
import etag from 'etag'
import fs, { promises as fsp } from 'fs'
import { SourceMap } from 'rollup'
import { ServerContext } from '..'
import { NextHandleFunction } from 'connect'
import { isCSSRequest } from '../../plugins/css'
import chalk from 'chalk'
import { cleanUrl } from '../../utils'

const debug = _debug('vite:transform')
const debugEtag = _debug('vite:etag')
const isDebug = !!process.env.DEBUG

export interface TransformResult {
  code: string
  map: SourceMap | null
}

/**
 * Cache transform result in memory. Must be invalidated on file change.
 */
const transformCache = new Map<string, TransformResult>()

/**
 * Cache etag. Must be invalidated on file change.
 */
const etagCache = new Map<string, string>()

/**
 * Store file -> url mapping information
 * One file may map to multiple urls, e.g. different parts of the Vue SFC
 * maps to the same file after stripping the query params.
 */
const fileToUrlMap = new Map<string, Set<string>>()

export async function transformFile(
  url: string,
  { container }: ServerContext
): Promise<TransformResult | null> {
  const cached = transformCache.get(url)
  if (cached) {
    isDebug && debug(`transform cache hit for ${url}`)
    return cached
  }

  // resolve
  const resolved = await container.resolveId(url)
  if (!resolved) {
    isDebug && debug(`no resolveId result: ${chalk.cyan(url)}`)
    return null
  }
  const id = resolved.id
  isDebug && debug(`resolve: ${chalk.yellow(url)} -> ${chalk.cyan(id)}`)

  // record file -> url relationships after successful resolve
  const cleanId = cleanUrl(id)
  let urls = fileToUrlMap.get(cleanId)
  if (!urls) {
    urls = new Set<string>()
    fileToUrlMap.set(cleanId, urls)
  }
  urls.add(url)

  // load
  let loadResult = await container.load(id)
  if (loadResult == null) {
    // try fallback loading it from fs
    if (fs.existsSync(cleanId) && fs.statSync(cleanId).isFile()) {
      loadResult = await fsp.readFile(cleanId, 'utf-8')
    }
  }
  if (loadResult == null) {
    isDebug && debug(`no load result: ${chalk.cyan(url)}`)
    return null
  }
  if (typeof loadResult !== 'string') {
    loadResult = loadResult.code
  }
  isDebug && debug(`loaded: ${chalk.yellow(url)}`)

  // transform
  let transformResult = await container.transform(loadResult, id)
  if (transformResult == null) {
    return null
  } else {
    isDebug && debug(`transformed: ${chalk.yellow(url)}`)
  }

  const result =
    typeof transformResult === 'string'
      ? { code: transformResult, map: null }
      : (transformResult as TransformResult)

  transformCache.set(url, result)
  return result
}

export function transformMiddleware(
  context: ServerContext
): NextHandleFunction {
  context.watcher.on('change', (file) => {
    const urls = fileToUrlMap.get(file)
    if (urls) {
      urls.forEach((url) => {
        debugEtag(`busting cache for ${url}`)
        transformCache.delete(url)
        etagCache.delete(url)
      })
    }
  })

  return async (req, res, next) => {
    const ifNoneMatch = req.headers['if-none-match']
    if (ifNoneMatch && ifNoneMatch === etagCache.get(req.url!)) {
      debugEtag(`etag cache hit for ${req.url}`)
      res.statusCode = 304
      return res.end()
    }

    let isCSS = false
    if (
      req.headers['accept'] === '*/*' || // <-- esm imports accept */* in most browsers
      req.headers['sec-fetch-dest'] === 'script' ||
      req.url!.endsWith('.map') ||
      (isCSS = isCSSRequest(req.url!))
    ) {
      try {
        const result = await transformFile(req.url!, context)
        if (result) {
          const Etag = etag(result.code, { weak: true })
          etagCache.set(req.url!, Etag)
          if (req.headers['if-none-match'] === Etag) {
            res.statusCode = 304
            return res.end()
          }

          res.setHeader(
            'Content-Type',
            isCSS ? 'text/css' : 'application/javascript'
          )
          res.setHeader('Cache-Control', 'no-cache')
          res.setHeader('Etag', Etag)
          // TODO handle source map
          return res.end(result.code)
        }
      } catch (e) {
        return next(e)
      }
    }

    next()
  }
}
