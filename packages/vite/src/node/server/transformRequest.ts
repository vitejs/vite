import { promises as fs } from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import getEtag from 'etag'
import convertSourceMap from 'convert-source-map'
import type { LoadResult, SourceDescription, SourceMap } from 'rollup'
import colors from 'picocolors'
import type { ViteDevServer } from '..'
import {
  blankReplacer,
  cleanUrl,
  createDebugger,
  ensureWatchedFile,
  isObject,
  prettifyUrl,
  removeTimestampQuery,
  timeFrom
} from '../utils'
import { checkPublicFile } from '../plugins/asset'
import { getDepsOptimizer } from '../optimizer'
import { DEP_VERSION_RE } from '../constants'
import { injectSourcesContent } from './sourcemap'
import { isFileServingAllowed } from './middlewares/static'
import { isFullCacheEntry } from './persistentCache'

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
  //
  // We save the timestamp when we start processing and compare it with the
  // last time this module is invalidated
  const timestamp = Date.now()

  const pending = server._pendingRequests.get(cacheKey)
  if (pending) {
    return server.moduleGraph
      .getModuleByUrl(removeTimestampQuery(url), options.ssr)
      .then((module) => {
        if (!module || pending.timestamp > module.lastInvalidationTimestamp) {
          // The pending request is still valid, we can safely reuse its result
          return pending.request
        } else {
          // Request 1 for module A     (pending.timestamp)
          // Invalidate module A        (module.lastInvalidationTimestamp)
          // Request 2 for module A     (timestamp)

          // First request has been invalidated, abort it to clear the cache,
          // then perform a new doTransform.
          pending.abort()
          return transformRequest(url, server, options)
        }
      })
  }

  const request = doTransform(url, server, options, timestamp)

  // Avoid clearing the cache of future requests if aborted
  let cleared = false
  const clearCache = () => {
    if (!cleared) {
      server._pendingRequests.delete(cacheKey)
      cleared = true
    }
  }

  // Cache the request and clear it once processing is done
  server._pendingRequests.set(cacheKey, {
    request,
    timestamp,
    abort: clearCache
  })
  request.then(clearCache, clearCache)

  return request
}

async function doTransform(
  url: string,
  server: ViteDevServer,
  options: TransformOptions,
  timestamp: number
) {
  url = removeTimestampQuery(url)

  const { config, pluginContainer } = server
  const prettyUrl = isDebug ? prettifyUrl(url, config.root) : ''
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

  // resolve
  const id =
    (await pluginContainer.resolveId(url, undefined, { ssr }))?.id || url

  const result = loadAndTransform(id, url, server, options, timestamp)

  getDepsOptimizer(config, ssr)?.delayDepsOptimizerUntil(id, () => result)

  return result
}

async function loadAndTransform(
  id: string,
  url: string,
  server: ViteDevServer,
  options: TransformOptions,
  timestamp: number
) {
  const { config, pluginContainer, moduleGraph, watcher, _persistentCache } =
    server
  const { root, logger } = config
  const prettyUrl = isDebug ? prettifyUrl(url, config.root) : ''
  const ssr = !!options.ssr

  const file = cleanUrl(id)

  let code: string | null = null
  let map: SourceDescription['map'] = null

  // load
  const loadStart = isDebug ? performance.now() : 0
  let loadResult: LoadResult

  const loadCacheKey = id.replace(DEP_VERSION_RE, '')

  loadResult = await pluginContainer.load(id, { ssr })

  const includedInPersistentCache =
    _persistentCache &&
    !file.includes(server.config.cacheDir) &&
    !file.includes('vite/dist/client') &&
    (!server.config.experimental.serverPersistentCaching?.exclude ||
      !server.config.experimental.serverPersistentCaching.exclude(url))

  // Persist load result just in case it depends on a previous `transform` call
  // that got cached (aka skipped)
  // For example: svelte component CSS subrequest
  // - `transform` is called on `MyComponent.svelte` => saves `<style>` section into
  // an internal cache as side effect
  // - `load` is called on `MyComponent.svelte?css` => reads the plugin internal cache

  if (includedInPersistentCache && loadCacheKey !== file) {
    const fileCacheInfo = (_persistentCache.manifest.files[file] =
      _persistentCache.manifest.files[file] ?? {
        relatedModules: {}
      })
    if (loadResult != null) {
      const saveKey = _persistentCache.getKey(loadCacheKey, ssr)
      let code: string
      let map: any | null
      if (typeof loadResult === 'string') {
        code = loadResult
      } else {
        code = loadResult.code
        map = loadResult.map
      }
      await _persistentCache.write(
        saveKey,
        id,
        undefined,
        null,
        ssr,
        file,
        code,
        map
      )
      fileCacheInfo.relatedModules[loadCacheKey] = saveKey
      _persistentCache.queueManifestWrite()
    } else {
      const saveKey = fileCacheInfo.relatedModules[loadCacheKey]
      if (saveKey) {
        loadResult = await _persistentCache.read(saveKey)
      }
    }
  }

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

        code = code.replace(convertSourceMap.mapFileCommentRegex, blankReplacer)
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

  let result: TransformResult | null = null

  // persistent cache

  const finalIncludedInPersistentCache =
    includedInPersistentCache &&
    // Exclude glob matching so it's always re-evaluated
    !code.includes('import.meta.glob')

  const persistentCacheKey = finalIncludedInPersistentCache
    ? _persistentCache.getKey(id + code, ssr)
    : ''

  if (finalIncludedInPersistentCache) {
    const cached = await _persistentCache.read(persistentCacheKey)
    if (cached) {
      // Restore module graph node info for HMR
      const entry = _persistentCache.manifest.modules[persistentCacheKey]
      if (entry && isFullCacheEntry(entry)) {
        const importedBindings = new Map<string, Set<string>>()
        for (const [key, value] of Object.entries(entry.importedBindings)) {
          importedBindings.set(key, new Set(value))
        }
        await moduleGraph.updateModuleInfo(
          mod,
          new Set(entry.importedModules.map(({ url }) => url)),
          importedBindings,
          new Set(entry.acceptedHmrDeps),
          new Set(entry.acceptedHmrExports),
          entry.isSelfAccepting as boolean,
          entry.ssr
        )
      }

      result = {
        code: cached.code,
        map: cached.map,
        etag: getEtag(cached.code, { weak: true })
      }
    }
  }

  if (!result) {
    // transform
    const transformStart = isDebug ? performance.now() : 0
    const transformResult = await pluginContainer.transform(code, id, {
      inMap: map,
      ssr
    })
    const originalCode = code
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

    result = ssr
      ? await server.ssrTransform(code, map as SourceMap, url, originalCode)
      : ({
          code,
          map,
          etag: getEtag(code, { weak: true })
        } as TransformResult)

    if (finalIncludedInPersistentCache && result) {
      await _persistentCache?.write(
        persistentCacheKey,
        id,
        url,
        mod,
        ssr,
        file,
        result.code,
        result.map
      )
    }
  }

  // Only cache the result if the module wasn't invalidated while it was
  // being processed, so it is re-processed next time if it is stale
  if (timestamp > mod.lastInvalidationTimestamp) {
    if (ssr) mod.ssrTransformResult = result
    else mod.transformResult = result
  }

  return result
}
