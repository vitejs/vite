import { promises as fs } from 'fs'
import path from 'path'
import getEtag from 'etag'
import * as convertSourceMap from 'convert-source-map'
import type { SourceDescription, SourceMap } from 'rollup'
import type { ViteDevServer } from '..'
import colors from 'picocolors'
import {
  createDebugger,
  cleanUrl,
  prettifyUrl,
  removeTimestampQuery,
  timeFrom,
  ensureWatchedFile,
  isObject
} from '../utils'
import { checkPublicFile } from '../plugins/asset'
import { ssrTransform } from '../ssr/ssrTransform'
import { injectSourcesContent } from './sourcemap'
import { isFileServingAllowed } from './middlewares/static'
import { performance } from 'perf_hooks'

const debugLoad = createDebugger('vite:load')
const debugTransform = createDebugger('vite:transform')
const debugCache = createDebugger('vite:cache')
const isDebug = !!process.env.DEBUG

export interface TransformResult {
  code: string
  map: SourceMap | null
  etag?: string
  deps?: string[]
  dynamicDeps?: string[]
}

export interface TransformOptions {
  ssr?: boolean
  html?: boolean
}

export function transformRequest(
  url: string,
  server: ViteDevServer,
  options: TransformOptions = {}
): Promise<TransformResult | null> {
  const cacheKey = (options.ssr ? 'ssr:' : options.html ? 'html:' : '') + url
  let request = server._pendingRequests.get(cacheKey)
  if (!request) {
    request = doTransform(url, server, options)
    server._pendingRequests.set(cacheKey, request)
    const done = () => server._pendingRequests.delete(cacheKey)
    request.then(done, done)
  }
  return request
}

async function doTransform(
  url: string,
  server: ViteDevServer,
  options: TransformOptions
) {
  url = removeTimestampQuery(url)
  const { config, pluginContainer, moduleGraph, watcher } = server
  const { root, logger } = config
  const prettyUrl = isDebug ? prettifyUrl(url, root) : ''
  const ssr = !!options.ssr

  const module = await server.moduleGraph.getModuleByUrl(url, ssr)

  // check if we have a fresh cache
  const cached =
    module && (ssr ? module.ssrTransformResult : module.transformResult)
  if (cached) {
    // TODO: check if the module is "partially invalidated" - i.e. an import
    // down the chain has been fully invalidated, but this current module's
    // content has not changed.
    // in this case, we can reuse its previous cached result and only update
    // its import timestamps.

    isDebug && debugCache(`[memory] ${prettyUrl}`)
    return cached
  }

  // This module may get invalidated while we are processing it. For example
  // when a full page reload is needed after the re-processing of pre-bundled
  // dependencies when a missing dep is discovered. We save the current time
  // to compare it to the last invalidation performed to know if we should
  // cache the result of the transformation or we should discard it as stale.
  //
  // A module can be invalidated due to:
  // 1. A full reload because of pre-bundling newly discovered deps
  // 2. A full reload after a config change
  // 3. The file that generated the module changed
  // 4. Invalidation for a virtual module
  //
  // For 1 and 2, a new request for this module will be issued after
  // the invalidation as part of the browser reloading the page. For 3 and 4
  // there may not be a new request right away because of HMR handling.
  // In all cases, the next time this module is requested, it should be
  // re-processed.
  const timestamp = Date.now()

  // resolve
  const id =
    (await pluginContainer.resolveId(url, undefined, { ssr }))?.id || url
  const file = cleanUrl(id)

  let code: string | null = null
  let map: SourceDescription['map'] = null

  // load
  const loadStart = isDebug ? performance.now() : 0
  const loadResult = await pluginContainer.load(id, { ssr })
  if (loadResult == null) {
    // if this is an html request and there is no load result, skip ahead to
    // SPA fallback.
    if (options.html && !id.endsWith('.html')) {
      return null
    }
    // try fallback loading it from fs as string
    // if the file is a binary, there should be a plugin that already loaded it
    // as string
    // only try the fallback if access is allowed, skip for out of root url
    // like /service-worker.js or /api/users
    if (options.ssr || isFileServingAllowed(file, server)) {
      try {
        code = await fs.readFile(file, 'utf-8')
        isDebug && debugLoad(`${timeFrom(loadStart)} [fs] ${prettyUrl}`)
      } catch (e) {
        if (e.code !== 'ENOENT') {
          throw e
        }
      }
    }
    if (code) {
      try {
        map = (
          convertSourceMap.fromSource(code) ||
          convertSourceMap.fromMapFileSource(code, path.dirname(file))
        )?.toObject()
      } catch (e) {
        logger.warn(`Failed to load source map for ${url}.`, {
          timestamp: true
        })
      }
    }
  } else {
    isDebug && debugLoad(`${timeFrom(loadStart)} [plugin] ${prettyUrl}`)
    if (isObject(loadResult)) {
      code = loadResult.code
      map = loadResult.map
    } else {
      code = loadResult
    }
  }
  if (code == null) {
    if (checkPublicFile(url, config)) {
      throw new Error(
        `Failed to load url ${url} (resolved id: ${id}). ` +
          `This file is in /public and will be copied as-is during build without ` +
          `going through the plugin transforms, and therefore should not be ` +
          `imported from source code. It can only be referenced via HTML tags.`
      )
    } else {
      return null
    }
  }

  // ensure module in graph after successful load
  const mod = await moduleGraph.ensureEntryFromUrl(url, ssr)
  ensureWatchedFile(watcher, mod.file, root)

  // transform
  const transformStart = isDebug ? performance.now() : 0
  const transformResult = await pluginContainer.transform(code, id, {
    inMap: map,
    ssr
  })
  if (
    transformResult == null ||
    (isObject(transformResult) && transformResult.code == null)
  ) {
    // no transform applied, keep code as-is
    isDebug &&
      debugTransform(
        timeFrom(transformStart) + colors.dim(` [skipped] ${prettyUrl}`)
      )
  } else {
    isDebug && debugTransform(`${timeFrom(transformStart)} ${prettyUrl}`)
    code = transformResult.code!
    map = transformResult.map
  }

  if (map && mod.file) {
    map = (typeof map === 'string' ? JSON.parse(map) : map) as SourceMap
    if (map.mappings && !map.sourcesContent) {
      await injectSourcesContent(map, mod.file, logger)
    }
  }

  const result = ssr
    ? await ssrTransform(code, map as SourceMap, url)
    : ({
        code,
        map,
        etag: getEtag(code, { weak: true })
      } as TransformResult)

  // Only cache the result if the module wasn't invalidated while it was
  // being processed, so it is re-processed next time if it is stale
  if (timestamp > mod.lastInvalidationTimestamp) {
    if (ssr) mod.ssrTransformResult = result
    else mod.transformResult = result
  }

  return result
}
