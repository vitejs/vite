import fsp from 'node:fs/promises'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import getEtag from 'etag'
import MagicString from 'magic-string'
import { init, parse as parseImports } from 'es-module-lexer'
import type { PartialResolvedId, SourceDescription, SourceMap } from 'rollup'
import colors from 'picocolors'
import type { ModuleNode, ViteDevServer } from '..'
import {
  createDebugger,
  ensureWatchedFile,
  injectQuery,
  isObject,
  prettifyUrl,
  removeImportQuery,
  removeTimestampQuery,
  stripBase,
  timeFrom,
} from '../utils'
import { checkPublicFile } from '../publicDir'
import { isDepsOptimizerEnabled } from '../config'
import { getDepsOptimizer, initDevSsrDepsOptimizer } from '../optimizer'
import { cleanUrl, unwrapId } from '../../shared/utils'
import {
  applySourcemapIgnoreList,
  extractSourcemapFromFile,
  injectSourcesContent,
} from './sourcemap'
import { isFileServingAllowed } from './middlewares/static'
import { throwClosedServerError } from './pluginContainer'

export const ERR_LOAD_URL = 'ERR_LOAD_URL'
export const ERR_LOAD_PUBLIC_URL = 'ERR_LOAD_PUBLIC_URL'
export const ERR_DENIED_ID = 'ERR_DENIED_ID'

const debugLoad = createDebugger('vite:load')
const debugTransform = createDebugger('vite:transform')
const debugCache = createDebugger('vite:cache')

export interface TransformResult {
  code: string
  map: SourceMap | { mappings: '' } | null
  etag?: string
  deps?: string[]
  dynamicDeps?: string[]
}

export interface TransformOptions {
  ssr?: boolean
  html?: boolean
  /**
   * @internal
   */
  allowId?: (id: string) => boolean
}

export function transformRequest(
  url: string,
  server: ViteDevServer,
  options: TransformOptions = {},
): Promise<TransformResult | null> {
  if (server._restartPromise && !options.ssr) throwClosedServerError()

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
    abort: clearCache,
  })

  return request.finally(clearCache)
}

async function doTransform(
  url: string,
  server: ViteDevServer,
  options: TransformOptions,
  timestamp: number,
) {
  url = removeTimestampQuery(url)

  const { config, pluginContainer } = server
  const ssr = !!options.ssr

  if (ssr && isDepsOptimizerEnabled(config, true)) {
    await initDevSsrDepsOptimizer(config, server)
  }

  let module = await server.moduleGraph.getModuleByUrl(url, ssr)
  if (module) {
    // try use cache from url
    const cached = await getCachedTransformResult(
      url,
      module,
      server,
      ssr,
      timestamp,
    )
    if (cached) return cached
  }

  const resolved = module
    ? undefined
    : ((await pluginContainer.resolveId(url, undefined, { ssr })) ?? undefined)

  // resolve
  const id = module?.id ?? resolved?.id ?? url

  module ??= server.moduleGraph.getModuleById(id)
  if (module) {
    // if a different url maps to an existing loaded id,  make sure we relate this url to the id
    await server.moduleGraph._ensureEntryFromUrl(url, ssr, undefined, resolved)
    // try use cache from id
    const cached = await getCachedTransformResult(
      url,
      module,
      server,
      ssr,
      timestamp,
    )
    if (cached) return cached
  }

  const result = loadAndTransform(
    id,
    url,
    server,
    options,
    timestamp,
    module,
    resolved,
  )

  if (!ssr) {
    // Only register client requests, server.waitForRequestsIdle should
    // have been called server.waitForClientRequestsIdle. We can rename
    // it as part of the environment API work
    const depsOptimizer = getDepsOptimizer(config, ssr)
    if (!depsOptimizer?.isOptimizedDepFile(id)) {
      server._registerRequestProcessing(id, () => result)
    }
  }

  return result
}

async function getCachedTransformResult(
  url: string,
  module: ModuleNode,
  server: ViteDevServer,
  ssr: boolean,
  timestamp: number,
) {
  const prettyUrl = debugCache ? prettifyUrl(url, server.config.root) : ''

  // tries to handle soft invalidation of the module if available,
  // returns a boolean true is successful, or false if no handling is needed
  const softInvalidatedTransformResult =
    module &&
    (await handleModuleSoftInvalidation(module, ssr, timestamp, server))
  if (softInvalidatedTransformResult) {
    debugCache?.(`[memory-hmr] ${prettyUrl}`)
    return softInvalidatedTransformResult
  }

  // check if we have a fresh cache
  const cached =
    module && (ssr ? module.ssrTransformResult : module.transformResult)
  if (cached) {
    debugCache?.(`[memory] ${prettyUrl}`)
    return cached
  }
}

async function loadAndTransform(
  id: string,
  url: string,
  server: ViteDevServer,
  options: TransformOptions,
  timestamp: number,
  mod?: ModuleNode,
  resolved?: PartialResolvedId,
) {
  const { config, pluginContainer, moduleGraph } = server
  const { logger } = config
  const prettyUrl =
    debugLoad || debugTransform ? prettifyUrl(url, config.root) : ''
  const ssr = !!options.ssr

  const file = cleanUrl(id)

  if (options.allowId && !options.allowId(id)) {
    const err: any = new Error(`Denied ID ${id}`)
    err.code = ERR_DENIED_ID
    throw err
  }

  let code: string | null = null
  let map: SourceDescription['map'] = null

  // load
  const loadStart = debugLoad ? performance.now() : 0
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
        code = await fsp.readFile(file, 'utf-8')
        debugLoad?.(`${timeFrom(loadStart)} [fs] ${prettyUrl}`)
      } catch (e) {
        if (e.code !== 'ENOENT') {
          if (e.code === 'EISDIR') {
            e.message = `${e.message} ${file}`
          }
          throw e
        }
      }
      if (code != null) {
        ensureWatchedFile(server.watcher, file, config.root)
      }
    }
    if (code) {
      try {
        const extracted = await extractSourcemapFromFile(code, file)
        if (extracted) {
          code = extracted.code
          map = extracted.map
        }
      } catch (e) {
        logger.warn(`Failed to load source map for ${file}.\n${e}`, {
          timestamp: true,
        })
      }
    }
  } else {
    debugLoad?.(`${timeFrom(loadStart)} [plugin] ${prettyUrl}`)
    if (isObject(loadResult)) {
      code = loadResult.code
      map = loadResult.map
    } else {
      code = loadResult
    }
  }
  if (code == null) {
    const isPublicFile = checkPublicFile(url, config)
    let publicDirName = path.relative(config.root, config.publicDir)
    if (publicDirName[0] !== '.') publicDirName = '/' + publicDirName
    const msg = isPublicFile
      ? `This file is in ${publicDirName} and will be copied as-is during ` +
        `build without going through the plugin transforms, and therefore ` +
        `should not be imported from source code. It can only be referenced ` +
        `via HTML tags.`
      : `Does the file exist?`
    const importerMod: ModuleNode | undefined = server.moduleGraph.idToModuleMap
      .get(id)
      ?.importers.values()
      .next().value
    const importer = importerMod?.file || importerMod?.url
    const err: any = new Error(
      `Failed to load url ${url} (resolved id: ${id})${
        importer ? ` in ${importer}` : ''
      }. ${msg}`,
    )
    err.code = isPublicFile ? ERR_LOAD_PUBLIC_URL : ERR_LOAD_URL
    throw err
  }

  if (server._restartPromise && !ssr) throwClosedServerError()

  // ensure module in graph after successful load
  mod ??= await moduleGraph._ensureEntryFromUrl(url, ssr, undefined, resolved)

  // transform
  const transformStart = debugTransform ? performance.now() : 0
  const transformResult = await pluginContainer.transform(code, id, {
    inMap: map,
    ssr,
  })
  const originalCode = code
  if (
    transformResult == null ||
    (isObject(transformResult) && transformResult.code == null)
  ) {
    // no transform applied, keep code as-is
    debugTransform?.(
      timeFrom(transformStart) + colors.dim(` [skipped] ${prettyUrl}`),
    )
  } else {
    debugTransform?.(`${timeFrom(transformStart)} ${prettyUrl}`)
    code = transformResult.code!
    map = transformResult.map
  }

  let normalizedMap: SourceMap | { mappings: '' } | null
  if (typeof map === 'string') {
    normalizedMap = JSON.parse(map)
  } else if (map) {
    normalizedMap = map as SourceMap | { mappings: '' }
  } else {
    normalizedMap = null
  }

  if (normalizedMap && 'version' in normalizedMap && mod.file) {
    if (normalizedMap.mappings) {
      await injectSourcesContent(normalizedMap, mod.file, logger)
    }

    const sourcemapPath = `${mod.file}.map`
    applySourcemapIgnoreList(
      normalizedMap,
      sourcemapPath,
      config.server.sourcemapIgnoreList,
      logger,
    )

    if (path.isAbsolute(mod.file)) {
      let modDirname
      for (
        let sourcesIndex = 0;
        sourcesIndex < normalizedMap.sources.length;
        ++sourcesIndex
      ) {
        const sourcePath = normalizedMap.sources[sourcesIndex]
        if (sourcePath) {
          // Rewrite sources to relative paths to give debuggers the chance
          // to resolve and display them in a meaningful way (rather than
          // with absolute paths).
          if (path.isAbsolute(sourcePath)) {
            modDirname ??= path.dirname(mod.file)
            normalizedMap.sources[sourcesIndex] = path.relative(
              modDirname,
              sourcePath,
            )
          }
        }
      }
    }
  }

  if (server._restartPromise && !ssr) throwClosedServerError()

  const result =
    ssr && !server.config.experimental.skipSsrTransform
      ? await server.ssrTransform(code, normalizedMap, url, originalCode)
      : ({
          code,
          map: normalizedMap,
          etag: getEtag(code, { weak: true }),
        } satisfies TransformResult)

  // Only cache the result if the module wasn't invalidated while it was
  // being processed, so it is re-processed next time if it is stale
  if (timestamp > mod.lastInvalidationTimestamp)
    moduleGraph.updateModuleTransformResult(mod, result, ssr)

  return result
}

/**
 * When a module is soft-invalidated, we can preserve its previous `transformResult` and
 * return similar code to before:
 *
 * - Client: We need to transform the import specifiers with new timestamps
 * - SSR: We don't need to change anything as `ssrLoadModule` controls it
 */
async function handleModuleSoftInvalidation(
  mod: ModuleNode,
  ssr: boolean,
  timestamp: number,
  server: ViteDevServer,
) {
  const transformResult = ssr ? mod.ssrInvalidationState : mod.invalidationState

  // Reset invalidation state
  if (ssr) mod.ssrInvalidationState = undefined
  else mod.invalidationState = undefined

  // Skip if not soft-invalidated
  if (!transformResult || transformResult === 'HARD_INVALIDATED') return

  if (ssr ? mod.ssrTransformResult : mod.transformResult) {
    throw new Error(
      `Internal server error: Soft-invalidated module "${mod.url}" should not have existing transform result`,
    )
  }

  let result: TransformResult
  // For SSR soft-invalidation, no transformation is needed
  if (ssr) {
    result = transformResult
  }
  // For client soft-invalidation, we need to transform each imports with new timestamps if available
  else {
    await init
    const source = transformResult.code
    const s = new MagicString(source)
    const [imports] = parseImports(source, mod.id || undefined)

    for (const imp of imports) {
      let rawUrl = source.slice(imp.s, imp.e)
      if (rawUrl === 'import.meta') continue

      const hasQuotes = rawUrl[0] === '"' || rawUrl[0] === "'"
      if (hasQuotes) {
        rawUrl = rawUrl.slice(1, -1)
      }

      const urlWithoutTimestamp = removeTimestampQuery(rawUrl)
      // hmrUrl must be derived the same way as importAnalysis
      const hmrUrl = unwrapId(
        stripBase(removeImportQuery(urlWithoutTimestamp), server.config.base),
      )
      for (const importedMod of mod.clientImportedModules) {
        if (importedMod.url !== hmrUrl) continue
        if (importedMod.lastHMRTimestamp > 0) {
          const replacedUrl = injectQuery(
            urlWithoutTimestamp,
            `t=${importedMod.lastHMRTimestamp}`,
          )
          const start = hasQuotes ? imp.s + 1 : imp.s
          const end = hasQuotes ? imp.e - 1 : imp.e
          s.overwrite(start, end, replacedUrl)
        }

        if (imp.d === -1 && server.config.server.preTransformRequests) {
          // pre-transform known direct imports
          server.warmupRequest(hmrUrl, { ssr })
        }

        break
      }
    }

    // Update `transformResult` with new code. We don't have to update the sourcemap
    // as the timestamp changes doesn't affect the code lines (stable).
    const code = s.toString()
    result = {
      ...transformResult,
      code,
      etag: getEtag(code, { weak: true }),
    }
  }

  // Only cache the result if the module wasn't invalidated while it was
  // being processed, so it is re-processed next time if it is stale
  if (timestamp > mod.lastInvalidationTimestamp)
    server.moduleGraph.updateModuleTransformResult(mod, result, ssr)

  return result
}
