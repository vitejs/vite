import colors from 'picocolors'
import {
  createOptimizeDepsRun,
  getOptimizedDepPath,
  getOptimizedBrowserHash,
  depsFromOptimizedDepInfo,
  newDepOptimizationProcessing
} from '.'
import type {
  DepOptimizationMetadata,
  DepOptimizationResult,
  OptimizedDepInfo
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

  let depOptimizationProcessing = newDepOptimizationProcessing()

  let lastDepOptimizationPromise = metadata.processing

  async function rerun(ssr: boolean | undefined) {
    // debounce time to wait for new missing deps finished, issue a new
    // optimization of deps (both old and newly found) once the previous
    // optimizeDeps processing is finished

    // a succesful completion of the optimizeDeps rerun will end up
    // creating new bundled version of all current and discovered deps
    // in the cache dir and a new metadata info object assigned
    // to server._optimizeDepsMetadata. A fullReload is only issued if
    // the previous bundled dependencies have changed.

    // if the rerun fails, server._optimizeDepsMetadata remains untouched,
    // current discovered deps are cleaned, and a fullReload is issued

    // optimizeDeps needs to be run in serie. Await until the previous
    // rerun is finished here. It could happen that two reruns are queued
    // in that case, we only need to run one of them
    const awaitedOptimizeDepsPromise = lastDepOptimizationPromise

    await lastDepOptimizationPromise

    if (awaitedOptimizeDepsPromise !== lastDepOptimizationPromise) {
      // There were two or more rerun queued and one of them already
      // started. Only let through the first one, and discard the others
      return
    }

    if (handle) {
      // New deps could have been found here, skip this rerun. Once the
      // debounce time is over, a new rerun will be issued
      return
    }

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
    const thisDepOptimizationProcessing = depOptimizationProcessing

    // Other rerun will await until this run is finished
    lastDepOptimizationPromise = thisDepOptimizationProcessing.promise

    let processingResult: DepOptimizationResult | undefined

    // Create a new promise for the next rerun, discovered missing
    // dependencies will be asigned this promise from this point
    depOptimizationProcessing = newDepOptimizationProcessing()

    let newData: DepOptimizationMetadata | null = null

    try {
      const optimizeDeps = await createOptimizeDepsRun(
        server.config,
        true,
        false,
        metadata,
        newDeps,
        ssr
      )

      // We await the optimizeDeps run here, we are only going to use
      // the newData if there wasn't an error
      newData = optimizeDeps.metadata
      processingResult = await optimizeDeps.run()

      // update ssr externals
      if (ssr) {
        server._ssrExternals = resolveSSRExternal(
          server.config,
          Object.keys(newData.optimized)
        )
      }

      // While optimizeDeps is running, new missing deps may be discovered,
      // in which case they will keep being added to metadata.discovered
      for (const o of Object.keys(metadata.discovered)) {
        if (!newData.optimized[o] && !newData.discovered[o]) {
          newData.discovered[o] = metadata.discovered[o]
          delete metadata.discovered[o]
        }
      }
      newData.processing = thisDepOptimizationProcessing.promise
      metadata = server._optimizeDepsMetadata = newData

      if (!needFullReload && !processingResult?.alteredFiles) {
        logger.info(colors.green(`✨ new dependencies pre-bundled...`), {
          timestamp: true
        })
      } else {
        if (Object.keys(metadata.discovered).length > 0) {
          // There are newly discovered deps, and another rerun is about to be
          // excecuted. Avoid the current full reload, but queue it for the next one
          needFullReload = true
          logger.info(
            colors.green(
              `✨ dependencies updated, delaying reload as new dependencies have been found...`
            ),
            {
              timestamp: true
            }
          )
        } else {
          logger.info(
            colors.green(`✨ dependencies updated, reloading page...`),
            {
              timestamp: true
            }
          )
          fullReload()
        }
      }
    } catch (e) {
      logger.error(
        colors.red(`error while updating dependencies:\n${e.stack}`),
        { timestamp: true, error: e }
      )

      // Reset missing deps, let the server rediscover the dependencies
      metadata.discovered = {}
      fullReload()
    } finally {
      // Rerun finished, resolve the promise to let awaiting requests or
      // other rerun queued be processed
      thisDepOptimizationProcessing.resolve()
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
      // We are already discover this dependency
      // It will be processed in the next rerun call
      return missing
    }
    missing = metadata.discovered[id] = {
      file: getOptimizedDepPath(id, server.config),
      src: resolved,
      // Assing a browserHash to this missing dependency that is unique to
      // the current state of known + missing deps. If its optimizeDeps run
      // doesn't alter the bundled files of previous known dependendencies,
      // we don't need a full reload and this browserHash will be kept
      browserHash: getOptimizedBrowserHash(
        metadata.hash,
        depsFromOptimizedDepInfo(metadata.optimized),
        depsFromOptimizedDepInfo(metadata.discovered)
      ),
      // loading of this pre-bundled dep needs to await for its processing
      // promise to be resolved
      processing: depOptimizationProcessing.promise
    }

    // Debounced rerun, let other missing dependencies be discovered before
    // the running next optimizeDeps
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
