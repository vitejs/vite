import type {
  CacheTransformReadResult,
  DepOptimizationMetadata,
  Plugin,
} from 'vite'
import type {
  DepsMetadataManager,
  ManifestManager,
  Options,
  ResolvedOptions,
} from './types'
import { resolveOptions } from './options.js'
import { computeCacheVersion } from './cache-version.js'
import { useCacheManifest } from './manifest.js'
import { getCodeHash } from './utils.js'
import { DEP_VERSION_RE } from './const.js'
import { read } from './read.js'
import { write } from './write.js'
import { useDepsMetadata } from './deps.js'

function vitePersistentCachePlugin(pluginOptions: Options = {}): Plugin {
  let resolvedOptions: ResolvedOptions
  let cacheVersion: string
  let manifestManager: ManifestManager
  let depsMetadataManager: DepsMetadataManager

  /**
   * This is used to skip read for modules that were patched by the cache for future warm restarts
   * in case the same module is red from persistent cache again during the same session.
   * For example: rewriting optimized deps imports should be "reverted" for the current session
   * as they will be incorrect otherwise (vite keeps the version query stable until next restart).
   */
  const patchedDuringCurrentSession = new Set<string>()

  return {
    name: 'vite:persistent-cache',
    apply: 'serve',

    async configResolved(config) {
      resolvedOptions = resolveOptions({
        pluginOptions,
        cacheDir: config.cacheDir,
        root: config.root,
      })

      cacheVersion = await computeCacheVersion(resolvedOptions, config)

      manifestManager = await useCacheManifest(
        resolvedOptions.cacheDir,
        cacheVersion,
      )

      depsMetadataManager = useDepsMetadata({
        manifest: manifestManager.manifest,
        patchedDuringCurrentSession,
      })
    },

    async serveLoadCacheRead({ id, file, url, ssr }) {
      const isIncluded =
        !file.includes(resolvedOptions.cacheDir) &&
        // Don't cache vite client
        !file.includes('vite/dist/client') &&
        // Don't cache optimized deps
        !id.includes('.vite/deps') &&
        (!resolvedOptions?.exclude || !resolvedOptions.exclude(url))

      if (!isIncluded) {
        return null
      }

      const cacheKey =
        getCodeHash(id.replace(DEP_VERSION_RE, '')) + (ssr ? '-ssr' : '')

      return {
        cacheKey,
        result: await read({
          key: cacheKey,
          manifest: manifestManager.manifest,
          patchedDuringCurrentSession,
        }),
      }
    },

    async serveLoadCacheWrite(data) {
      await write({
        data,
        resolvedOptions,
        manifestManager,
        depsMetadataManager,
        patchedDuringCurrentSession,
      })
      manifestManager.queueManifestWrite()
    },

    async serveTransformCacheRead({ id, code, ssr }) {
      const isIncluded =
        // Exclude glob matching so it's always re-evaluated
        !code.includes('import.meta.glob')

      if (!isIncluded) {
        return null
      }

      const cacheKey = getCodeHash(id + code) + (ssr ? '-ssr' : '')
      let result: CacheTransformReadResult['result'] | null = null

      const cached = await read({
        key: cacheKey,
        manifest: manifestManager.manifest,
        patchedDuringCurrentSession,
      })
      if (cached) {
        result = {
          code: cached.code,
          map: cached.map,
          hmr: undefined,
        }

        // Restore module graph node info for HMR
        const entry = manifestManager.manifest.modules[cacheKey]
        if (entry?.fullData) {
          const importedBindings = new Map<string, Set<string>>()
          for (const [key, value] of Object.entries(
            entry.fullData.importedBindings,
          )) {
            importedBindings.set(key, new Set(value))
          }

          result.hmr = {
            importedModules: new Set(
              entry.fullData.importedModules.map(({ url }) => url),
            ),
            importedBindings,
            acceptedModules: new Set(entry.fullData.acceptedHmrDeps),
            acceptedExports: new Set(entry.fullData.acceptedHmrExports),
            isSelfAccepting: !!entry.fullData.isSelfAccepting,
          }
        }
      }

      return {
        cacheKey,
        result,
      }
    },

    async serveTransformCacheWrite(data) {
      await write({
        data,
        resolvedOptions,
        manifestManager,
        depsMetadataManager,
        patchedDuringCurrentSession,
      })
    },

    async depsOptimized(metadata) {
      // Clone the metadata to prevent it being mutated directly by vite
      // (example: reload-less deps optimization)
      const optimized: DepOptimizationMetadata['optimized'] = {}
      for (const id in metadata.optimized) {
        const dep = metadata.optimized[id]
        optimized[id] = {
          ...dep,
        }
      }
      await depsMetadataManager.updateDepsMetadata(optimized)
    },
  }
}

export default vitePersistentCachePlugin
