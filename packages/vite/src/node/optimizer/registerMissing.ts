import colors from 'picocolors'
import {
  createOptimizeDepsRun,
  getOptimizedDepPath,
  getHash,
  depsFromOptimizedDepInfo,
  newDepOptimizationProcessing
} from '.'
import type {
  DepOptimizationMetadata,
  DepOptimizationProcessing,
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
  server: ViteDevServer,
  initialProcessingPromise: Promise<void>
): (id: string, resolved: string, ssr?: boolean) => OptimizedDepInfo {
  const { logger } = server.config
  let metadata = server._optimizeDepsMetadata!

  let handle: NodeJS.Timeout | undefined
  let newDepsDiscovered = false

  let depOptimizationProcessing = newDepOptimizationProcessing()
  let depOptimizationProcessingQueue: DepOptimizationProcessing[] = []
  const resolveEnqueuedProcessingPromises = () => {
    // Resolve all the processings (including the ones which were delayed)
    for (const processing of depOptimizationProcessingQueue) {
      processing.resolve()
    }
    depOptimizationProcessingQueue = []
  }

  let enqueuedRerun: (() => void) | undefined
  let currentlyProcessing = true
  initialProcessingPromise.then(() => {
    currentlyProcessing = false
    enqueuedRerun?.()
  })

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

    // Ensure that rerun is called sequentially
    enqueuedRerun = undefined
    currentlyProcessing = true

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

    const newDeps: Record<string, OptimizedDepInfo> = {}

    // Clone optimized info objects, fileHash, browserHash may be changed for them
    for (const dep of Object.keys(metadata.optimized)) {
      newDeps[dep] = { ...metadata.optimized[dep] }
    }
    // Don't clone discovered info objects, they are read after awaited
    for (const dep of Object.keys(metadata.discovered)) {
      newDeps[dep] = metadata.discovered[dep]
    }

    newDepsDiscovered = false

    // Add the current depOptimizationProcessing to the queue, these
    // promises are going to be resolved once a rerun is committed
    depOptimizationProcessingQueue.push(depOptimizationProcessing)

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

      const processingResult = await optimizeDeps.run()

      const commitProcessing = () => {
        processingResult.commit()

        newData = optimizeDeps.metadata

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
          if (!newData.optimized[o]) {
            newData.discovered[o] = metadata.discovered[o]
          }
        }
        metadata = server._optimizeDepsMetadata = newData

        resolveEnqueuedProcessingPromises()
      }

      if (!processingResult.alteredFiles) {
        commitProcessing()

        logger.info(colors.green(`✨ new dependencies pre-bundled...`), {
          timestamp: true
        })
      } else {
        if (newDepsDiscovered) {
          // There are newly discovered deps, and another rerun is about to be
          // excecuted. Avoid the current full reload discarding this rerun result
          // We don't resolve the processing promise, as they will be resolved
          // once a rerun is committed
          processingResult.cancel()

          logger.info(
            colors.green(
              `✨ delaying reload as new dependencies have been found...`
            ),
            {
              timestamp: true
            }
          )
        } else {
          commitProcessing()

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
      resolveEnqueuedProcessingPromises()

      // Reset missing deps, let the server rediscover the dependencies
      metadata.discovered = {}
      fullReload()
    }

    currentlyProcessing = false
    // @ts-ignore
    enqueuedRerun?.()
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
  }

  const discoveredTimestamp = Date.now()

  function getDiscoveredBrowserHash(
    hash: string,
    deps: Record<string, string>,
    missing: Record<string, string>
  ) {
    return getHash(
      hash +
        JSON.stringify(deps) +
        JSON.stringify(missing) +
        discoveredTimestamp
    )
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
    const chunk = metadata.chunks[id]
    if (chunk) {
      return chunk
    }
    let missing = metadata.discovered[id]
    if (missing) {
      // We are already discover this dependency
      // It will be processed in the next rerun call
      return missing
    }
    newDepsDiscovered = true
    missing = metadata.discovered[id] = {
      file: getOptimizedDepPath(id, server.config),
      src: resolved,
      // Assing a browserHash to this missing dependency that is unique to
      // the current state of known + missing deps. If its optimizeDeps run
      // doesn't alter the bundled files of previous known dependendencies,
      // we don't need a full reload and this browserHash will be kept
      browserHash: getDiscoveredBrowserHash(
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
    enqueuedRerun = undefined
    if (handle) clearTimeout(handle)
    handle = setTimeout(() => {
      handle = undefined
      enqueuedRerun = () => rerun(ssr)
      if (!currentlyProcessing) {
        enqueuedRerun()
      }
    }, debounceMs)

    // Return the path for the optimized bundle, this path is known before
    // esbuild is run to generate the pre-bundle
    return missing
  }
}
