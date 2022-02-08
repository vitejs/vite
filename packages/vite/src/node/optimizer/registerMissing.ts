import colors from 'picocolors'
import {
  optimizeDeps,
  getOptimizedFilePath,
  getOptimizedBrowserHash,
  depsFromOptimizedInfo,
  newOptimizeDepsProcessingPromise
} from '.'
import type {
  DepOptimizationMetadata,
  OptimizedDepInfo,
  OptimizeDepsResult
} from '.'
import type { ViteDevServer } from '..'
import { resolveSSRExternal } from '../ssr/ssrExternal'

/**
 * The amount to wait for requests to register newly found dependencies before triggering
 * a re-bundle + page reload
 */
const debounceMs = 100

export function createMissingImporterRegisterFn(
  server: ViteDevServer
): (id: string, resolved: string, ssr?: boolean) => OptimizedDepInfo {
  const { logger } = server.config
  let metadata = server._optimizeDepsMetadata!

  let handle: NodeJS.Timeout | undefined
  let needFullReload: boolean = false

  let processingMissingDeps = newOptimizeDepsProcessingPromise()

  async function rerun(ssr: boolean | undefined) {
    // debounce time to wait for new missing deps finished, issue a new
    // optimization of deps (both old and newly found) once the previous
    // optimizeDeps processing is finished
    await metadata.processing

    // New deps could have been found here, clear the timeout to already
    // consider them in this run
    if (handle) clearTimeout(handle)
    handle = undefined

    logger.info(
      colors.yellow(
        `new dependencies found: ${Object.keys(metadata.discovered).join(
          ', '
        )}, updating...`
      ),
      {
        timestamp: true
      }
    )

    // All deps, previous known and newly discovered are rebundled,
    // respect insertion order to keep the metadata file stable
    const newDeps = { ...metadata.optimized, ...metadata.discovered }
    const newDepsProcessing = processingMissingDeps
    let processingResult: OptimizeDepsResult | undefined

    processingMissingDeps = newOptimizeDepsProcessingPromise()

    let newData: DepOptimizationMetadata | null = null

    try {
      // During optimizer re-run, the resolver may continue to discover
      // optimized files. If we directly resolve to node modules there
      // is no way to avoid a full-page reload

      newData = server._optimizeDepsMetadata = await optimizeDeps(
        server.config,
        true,
        false,
        metadata,
        newDeps,
        ssr,
        newDepsProcessing
      )

      // While optimizeDeps is running, new missing deps may be discovered,
      // in which case they will keep being added to metadata.discovered
      for (const o of Object.keys(metadata.discovered)) {
        if (!newData.optimized[o] && !newData.discovered[o]) {
          newData.discovered[o] = metadata.discovered[o]
          delete metadata.discovered[o]
        }
      }
      metadata = newData

      // update ssr externals
      if (ssr) {
        server._ssrExternals = resolveSSRExternal(
          server.config,
          Object.keys(metadata.optimized)
        )
      }

      processingResult = await newData!.processing
    } catch (e) {
      logger.error(
        colors.red(`error while updating dependencies:\n${e.stack}`),
        { timestamp: true, error: e }
      )
      fullReload()
      return
    }

    if (!needFullReload && processingResult?.stableFiles !== false) {
      logger.info(colors.green(`✨ new dependencies pre-bundled...`), {
        timestamp: true
      })
    } else {
      logger.info(colors.green(`✨ dependencies updated, reloading page...`), {
        timestamp: true
      })

      if (handle) {
        // There are newly discovered deps, and another rerun is about to be
        // excecuted. Avoid the current full reload, but queue it for the next one
        needFullReload = true
      } else {
        fullReload()
      }
    }
  }

  function fullReload() {
    // Cached transform results have stale imports (resolved to
    // old locations) so they need to be invalidated before the page is
    // reloaded.
    server.moduleGraph.invalidateAll()

    server.ws.send({
      type: 'full-reload',
      path: '*'
    })

    needFullReload = false
  }

  return function registerMissingImport(
    id: string,
    resolved: string,
    ssr?: boolean
  ): OptimizedDepInfo {
    const optimized = metadata.optimized[id]
    if (optimized) {
      return optimized
    }
    let missing = metadata.discovered[id]
    if (missing) {
      // We are already discover this dependency, and it will be processed in
      // the next rerun call
      return missing
    }
    missing = metadata.discovered[id] = {
      file: getOptimizedFilePath(id, server.config.cacheDir),
      src: resolved,
      // Assing a browserHash to this missing dependency that is unique to
      // the current state of known + missing deps. If the optimizeDeps stage
      // ends up with stable paths for the new dep, then we don't need a
      // full page reload and this browserHash will be kept
      browserHash: getOptimizedBrowserHash(
        server._optimizeDepsMetadata!.hash,
        depsFromOptimizedInfo(metadata.optimized),
        depsFromOptimizedInfo(metadata.discovered)
      ),
      // loading of this pre-bundle dep needs to await for its processing
      // promise to be resolved
      processing: processingMissingDeps.promise
    }

    if (handle) clearTimeout(handle)
    handle = setTimeout(() => {
      handle = undefined
      rerun(ssr)
    }, debounceMs)

    // Return the path for the optimized bundle, this path is known before
    // esbuild is run to generate the pre-bundle
    return missing
  }
}
