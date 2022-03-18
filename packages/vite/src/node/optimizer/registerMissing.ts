import colors from 'picocolors'
import {
  createOptimizeDepsRun,
  getOptimizedDepPath,
  getHash,
  depsFromOptimizedDepInfo,
  newDepOptimizationProcessing,
  loadCachedDepOptimizationMetadata,
  createOptimizedDepsMetadata,
  discoverProjectDependencies,
  depsLogString
} from '.'
import type {
  DepOptimizationMetadata,
  DepOptimizationProcessing,
  OptimizedDepInfo,
  OptimizedDeps
} from '.'
import type { ViteDevServer } from '..'
import { resolveSSRExternal } from '../ssr/ssrExternal'

/**
 * The amount to wait for requests to register newly found dependencies before triggering
 * a re-bundle + page reload
 */
const debounceMs = 100

export async function createOptimizedDeps(
  server: ViteDevServer,
  asCommand = false
): Promise<OptimizedDeps> {
  const { config } = server
  const { logger } = config

  const cachedMetadata = loadCachedDepOptimizationMetadata(config)

  const optimizedDeps = {
    metadata: cachedMetadata || createOptimizedDepsMetadata(config),
    registerMissingImport
  } as OptimizedDeps

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
  let currentlyProcessing = false

  // If there wasn't a cache or it is outdated, perform a fast scan with esbuild
  // to quickly find project dependencies and do a first optimize run
  if (!cachedMetadata) {
    currentlyProcessing = true

    const scanPhaseProcessing = newDepOptimizationProcessing()
    optimizedDeps.scanProcessing = scanPhaseProcessing.promise

    const warmUp = async function () {
      try {
        logger.info(colors.green(`scanning for dependencies...`), {
          timestamp: true
        })

        const { metadata } = optimizedDeps

        const discovered = await discoverProjectDependencies(config)

        // Respect the scan phase discover order to improve reproducibility
        for (const dep of Object.keys(discovered)) {
          discovered[dep].processing = depOptimizationProcessing.promise
        }

        // This is auto run on server start - let the user know that we are
        // pre-optimizing deps
        const depsString = depsLogString(config, Object.keys(discovered))
        logger.info(colors.green(`dependencies found: ${depsString}`), {
          timestamp: true
        })

        metadata.discovered = discovered

        scanPhaseProcessing.resolve()
        optimizedDeps.scanProcessing = undefined

        runOptimizer()
      } catch (e) {
        logger.error(e.message)
        if (optimizedDeps.scanProcessing) {
          scanPhaseProcessing.resolve()
          optimizedDeps.scanProcessing = undefined
        }
      }
    }

    setTimeout(warmUp, 0)
  }

  async function runOptimizer(ssr?: boolean) {
    // Ensure that rerun is called sequentially
    enqueuedRerun = undefined
    currentlyProcessing = true

    // Ensure that a rerun will not be issued for current discovered deps
    if (handle) clearTimeout(handle)

    // a succesful completion of the optimizeDeps rerun will end up
    // creating new bundled version of all current and discovered deps
    // in the cache dir and a new metadata info object assigned
    // to optimizeDeps.metadata. A fullReload is only issued if
    // the previous bundled dependencies have changed.

    // if the rerun fails, optimizeDeps.metadata remains untouched,
    // current discovered deps are cleaned, and a fullReload is issued

    let { metadata } = optimizedDeps

    // All deps, previous known and newly discovered are rebundled,
    // respect insertion order to keep the metadata file stable

    const newDeps: Record<string, OptimizedDepInfo> = {}

    // Clone optimized info objects, fileHash, browserHash may be changed for them
    for (const dep of Object.keys(metadata.optimized)) {
      newDeps[dep] = { ...metadata.optimized[dep] }
    }
    for (const dep of Object.keys(metadata.discovered)) {
      // Clone the discovered info discarding its processing promise
      const { processing, ...info } = metadata.discovered[dep]
      newDeps[dep] = info
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
      const processingResult = await createOptimizeDepsRun(
        config,
        newDeps,
        metadata,
        ssr
      )

      const commitProcessing = () => {
        processingResult.commit()

        newData = processingResult.metadata

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

        // Commit hash and needsInterop changes to the discovered deps info
        // object. Allow for code to await for the discovered processing promise
        // and use the information in the same object
        for (const o of Object.keys(newData.optimized)) {
          const discovered = metadata.discovered[o]
          if (discovered) {
            const optimized = newData.optimized[o]
            discovered.browserHash = optimized.browserHash
            discovered.fileHash = optimized.fileHash
            discovered.needsInterop = optimized.needsInterop
          }
        }

        metadata = optimizedDeps.metadata = newData

        resolveEnqueuedProcessingPromises()
      }

      if (!processingResult.alteredFiles) {
        commitProcessing()

        logger.info(colors.green(`✨ dependencies pre-bundled...`), {
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

  async function rerun(ssr?: boolean) {
    // debounce time to wait for new missing deps finished, issue a new
    // optimization of deps (both old and newly found) once the previous
    // optimizeDeps processing is finished
    const deps = Object.keys(optimizedDeps.metadata.discovered)
    const depsString = depsLogString(config, deps)
    logger.info(colors.green(`new dependencies found: ${depsString}`), {
      timestamp: true
    })
    runOptimizer(ssr)
  }

  const optimizedDepsTimestamp = Date.now()

  function getDiscoveredBrowserHash(
    hash: string,
    deps: Record<string, string>,
    missing: Record<string, string>
  ) {
    return getHash(
      hash +
        JSON.stringify(deps) +
        JSON.stringify(missing) +
        optimizedDepsTimestamp
    )
  }

  function registerMissingImport(
    id: string,
    resolved: string,
    ssr?: boolean
  ): OptimizedDepInfo {
    if (optimizedDeps.scanProcessing) {
      config.logger.error(
        'Vite internal error: registering missing import before initial scanning is over'
      )
    }
    const { metadata } = optimizedDeps
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

  return optimizedDeps
}
