import fsp from 'node:fs/promises'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import getEtag from 'etag'
import MagicString from 'magic-string'
import { init, parse as parseImports } from 'es-module-lexer'
import type { PartialResolvedId, SourceDescription, SourceMap } from 'rollup'
import colors from 'picocolors'
import type { EnvironmentModuleNode } from '../server/moduleGraph'
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
import { ssrTransform } from '../ssr/ssrTransform'
import { checkPublicFile } from '../publicDir'
import { cleanUrl, unwrapId } from '../../shared/utils'
import {
  applySourcemapIgnoreList,
  extractSourcemapFromFile,
  injectSourcesContent,
} from './sourcemap'
import { isFileLoadingAllowed } from './middlewares/static'
import { throwClosedServerError } from './pluginContainer'
import type { DevEnvironment } from './environment'

export const ERR_LOAD_URL = 'ERR_LOAD_URL'
export const ERR_LOAD_PUBLIC_URL = 'ERR_LOAD_PUBLIC_URL'

const debugLoad = createDebugger('vite:load')
const debugTransform = createDebugger('vite:transform')
const debugCache = createDebugger('vite:cache')

export interface TransformResult {
  code: string
  map: SourceMap | { mappings: '' } | null
  ssr?: boolean
  etag?: string
  deps?: string[]
  dynamicDeps?: string[]
}

export interface TransformOptions {
  /**
   * @deprecated inferred from environment
   */
  ssr?: boolean
  /**
   * @internal
   */
  html?: boolean
}

// TODO: This function could be moved to the DevEnvironment class.
// It was already using private fields from the server before, and it now does
// the same with environment._closing, environment._pendingRequests and
// environment._registerRequestProcessing. Maybe it makes sense to keep it in
// separate file to preserve the history or keep the DevEnvironment class cleaner,
// but conceptually this is: `environment.transformRequest(url, options)`

export function transformRequest(
  environment: DevEnvironment,
  url: string,
  options: TransformOptions = {},
): Promise<TransformResult | null> {
  // Backward compatibility when only `ssr` is passed
  if (!options?.ssr) {
    // Backward compatibility
    options = { ...options, ssr: environment.config.consumer === 'server' }
  }

  if (environment._closing && environment.config.dev.recoverable)
    throwClosedServerError()

  const cacheKey = `${options.html ? 'html:' : ''}${url}`

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

  const pending = environment._pendingRequests.get(cacheKey)
  if (pending) {
    return environment.moduleGraph
      .getModuleByUrl(removeTimestampQuery(url))
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
          return transformRequest(environment, url, options)
        }
      })
  }

  const request = doTransform(environment, url, options, timestamp)

  // Avoid clearing the cache of future requests if aborted
  let cleared = false
  const clearCache = () => {
    if (!cleared) {
      environment._pendingRequests.delete(cacheKey)
      cleared = true
    }
  }

  // Cache the request and clear it once processing is done
  environment._pendingRequests.set(cacheKey, {
    request,
    timestamp,
    abort: clearCache,
  })

  return request.finally(clearCache)
}

async function doTransform(
  environment: DevEnvironment,
  url: string,
  options: TransformOptions,
  timestamp: number,
) {
  url = removeTimestampQuery(url)

  const { pluginContainer } = environment

  let module = await environment.moduleGraph.getModuleByUrl(url)
  if (module) {
    // try use cache from url
    const cached = await getCachedTransformResult(
      environment,
      url,
      module,
      timestamp,
    )
    if (cached) return cached
  }

  const resolved = module
    ? undefined
    : ((await pluginContainer.resolveId(url, undefined)) ?? undefined)

  // resolve
  const id = module?.id ?? resolved?.id ?? url

  module ??= environment.moduleGraph.getModuleById(id)
  if (module) {
    // if a different url maps to an existing loaded id,  make sure we relate this url to the id
    await environment.moduleGraph._ensureEntryFromUrl(url, undefined, resolved)
    // try use cache from id
    const cached = await getCachedTransformResult(
      environment,
      url,
      module,
      timestamp,
    )
    if (cached) return cached
  }

  const result = loadAndTransform(
    environment,
    id,
    url,
    options,
    timestamp,
    module,
    resolved,
  )

  const { depsOptimizer } = environment
  if (!depsOptimizer?.isOptimizedDepFile(id)) {
    environment._registerRequestProcessing(id, () => result)
  }

  return result
}

async function getCachedTransformResult(
  environment: DevEnvironment,
  url: string,
  module: EnvironmentModuleNode,
  timestamp: number,
) {
  const prettyUrl = debugCache ? prettifyUrl(url, environment.config.root) : ''

  // tries to handle soft invalidation of the module if available,
  // returns a boolean true is successful, or false if no handling is needed
  const softInvalidatedTransformResult =
    module &&
    (await handleModuleSoftInvalidation(environment, module, timestamp))
  if (softInvalidatedTransformResult) {
    debugCache?.(`[memory-hmr] ${prettyUrl}`)
    return softInvalidatedTransformResult
  }

  // check if we have a fresh cache
  const cached = module?.transformResult
  if (cached) {
    debugCache?.(`[memory] ${prettyUrl}`)
    return cached
  }
}

async function loadAndTransform(
  environment: DevEnvironment,
  id: string,
  url: string,
  options: TransformOptions,
  timestamp: number,
  mod?: EnvironmentModuleNode,
  resolved?: PartialResolvedId,
) {
  const { config, pluginContainer, logger } = environment
  const prettyUrl =
    debugLoad || debugTransform ? prettifyUrl(url, config.root) : ''

  const moduleGraph = environment.moduleGraph

  let code: string | null = null
  let map: SourceDescription['map'] = null

  // load
  const loadStart = debugLoad ? performance.now() : 0
  const loadResult = await pluginContainer.load(id)

  if (loadResult == null) {
    const file = cleanUrl(id)

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
    if (
      environment.config.consumer === 'server' ||
      isFileLoadingAllowed(environment.getTopLevelConfig(), file)
    ) {
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
      if (code != null && environment.pluginContainer.watcher) {
        ensureWatchedFile(
          environment.pluginContainer.watcher,
          file,
          config.root,
        )
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
    const isPublicFile = checkPublicFile(url, environment.getTopLevelConfig())
    let publicDirName = path.relative(config.root, config.publicDir)
    if (publicDirName[0] !== '.') publicDirName = '/' + publicDirName
    const msg = isPublicFile
      ? `This file is in ${publicDirName} and will be copied as-is during ` +
        `build without going through the plugin transforms, and therefore ` +
        `should not be imported from source code. It can only be referenced ` +
        `via HTML tags.`
      : `Does the file exist?`
    const importerMod: EnvironmentModuleNode | undefined =
      moduleGraph.idToModuleMap.get(id)?.importers.values().next().value
    const importer = importerMod?.file || importerMod?.url
    const err: any = new Error(
      `Failed to load url ${url} (resolved id: ${id})${
        importer ? ` in ${importer}` : ''
      }. ${msg}`,
    )
    err.code = isPublicFile ? ERR_LOAD_PUBLIC_URL : ERR_LOAD_URL
    throw err
  }

  if (environment._closing && environment.config.dev.recoverable)
    throwClosedServerError()

  // ensure module in graph after successful load
  mod ??= await moduleGraph._ensureEntryFromUrl(url, undefined, resolved)

  // transform
  const transformStart = debugTransform ? performance.now() : 0
  const transformResult = await pluginContainer.transform(code, id, {
    inMap: map,
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

  if (environment._closing && environment.config.dev.recoverable)
    throwClosedServerError()

  const topLevelConfig = environment.getTopLevelConfig()
  const result = environment.config.dev.moduleRunnerTransform
    ? await ssrTransform(code, normalizedMap, url, originalCode, {
        json: {
          stringify:
            topLevelConfig.json?.stringify === true &&
            topLevelConfig.json.namedExports !== true,
        },
      })
    : ({
        code,
        map: normalizedMap,
        etag: getEtag(code, { weak: true }),
      } satisfies TransformResult)

  // Only cache the result if the module wasn't invalidated while it was
  // being processed, so it is re-processed next time if it is stale
  if (timestamp > mod.lastInvalidationTimestamp)
    moduleGraph.updateModuleTransformResult(mod, result)

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
  environment: DevEnvironment,
  mod: EnvironmentModuleNode,
  timestamp: number,
) {
  const transformResult = mod.invalidationState

  // Reset invalidation state
  mod.invalidationState = undefined

  // Skip if not soft-invalidated
  if (!transformResult || transformResult === 'HARD_INVALIDATED') return

  if (mod.transformResult) {
    throw new Error(
      `Internal server error: Soft-invalidated module "${mod.url}" should not have existing transform result`,
    )
  }

  let result: TransformResult
  // For SSR soft-invalidation, no transformation is needed
  if (transformResult.ssr) {
    result = transformResult
  }
  // We need to transform each imports with new timestamps if available
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
        stripBase(
          removeImportQuery(urlWithoutTimestamp),
          environment.config.base,
        ),
      )
      for (const importedMod of mod.importedModules) {
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

        if (imp.d === -1 && environment.config.dev.preTransformRequests) {
          // pre-transform known direct imports
          environment.warmupRequest(hmrUrl)
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
    environment.moduleGraph.updateModuleTransformResult(mod, result)

  return result
}
