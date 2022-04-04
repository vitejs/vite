import colors from 'picocolors'
import _debug from 'debug'
import {
  runOptimizeDeps,
  getOptimizedDepPath,
  getHash,
  depsFromOptimizedDepInfo,
  newDepOptimizationProcessing,
  loadCachedDepOptimizationMetadata,
  createOptimizedDepsMetadata,
  addOptimizedDepInfo,
  discoverProjectDependencies,
  depsLogString,
  debuggerViteDeps as debug
} from '.'
import type {
  DepOptimizationProcessing,
  OptimizedDepInfo,
  OptimizedDeps
} from '.'
import type { ViteDevServer } from '..'

const isDebugEnabled = _debug('vite:deps').enabled

/**
 * The amount to wait for requests to register newly found dependencies before triggering
 * a re-bundle + page reload
 */
const debounceMs = 100

export function createOptimizedDeps(server: ViteDevServer): OptimizedDeps {
  const { config } = server
  const { logger } = config

  const sessionTimestamp = Date.now().toString()

  const cachedMetadata = loadCachedDepOptimizationMetadata(config)

  const optimizedDeps: OptimizedDeps = {
    metadata:
      cachedMetadata || createOptimizedDepsMetadata(config, sessionTimestamp),
    registerMissingImport
  }

  let handle: NodeJS.Timeout | undefined
  let newDepsDiscovered = false

  let newDepsToLog: string[] = []
  let newDepsToLogHandle: NodeJS.Timeout | undefined
  const logNewlyDiscoveredDeps = () => {
    if (newDepsToLog.length) {
      config.logger.info(
        colors.green(
          `✨ new dependencies optimized: ${depsLogString(newDepsToLog)}`
        ),
        {
          timestamp: true
        }
      )
      newDepsToLog = []
    }
  }

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

    const warmUp = async () => {
      try {
        debug(colors.green(`scanning for dependencies...`), {
          timestamp: true
        })

        const { metadata } = optimizedDeps

        const discovered = await discoverProjectDependencies(
          config,
          sessionTimestamp
        )

        // Respect the scan phase discover order to improve reproducibility
        for (const depInfo of Object.values(discovered)) {
          addOptimizedDepInfo(metadata, 'discovered', {
            ...depInfo,
            processing: depOptimizationProcessing.promise
          })
        }

        debug(
          colors.green(
            `dependencies found: ${depsLogString(Object.keys(discovered))}`
          ),
          {
            timestamp: true
          }
        )

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

  async function runOptimizer(isRerun = false) {
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

    try {
      const processingResult = await runOptimizeDeps(config, newDeps)

      const newData = processingResult.metadata

      // After a re-optimization, if the internal bundled chunks change a full page reload
      // is required. If the files are stable, we can avoid the reload that is expensive
      // for large applications. Comparing their fileHash we can find out if it is safe to
      // keep the current browser state.
      const needsReload =
        metadata.hash !== newData.hash ||
        Object.keys(metadata.optimized).some((dep) => {
          return (
            metadata.optimized[dep].fileHash !== newData.optimized[dep].fileHash
          )
        })

      const commitProcessing = () => {
        processingResult.commit()

        // While optimizeDeps is running, new missing deps may be discovered,
        // in which case they will keep being added to metadata.discovered
        for (const id in metadata.discovered) {
          if (!newData.optimized[id]) {
            addOptimizedDepInfo(newData, 'discovered', metadata.discovered[id])
          }
        }

        // If we don't reload the page, we need to keep browserHash stable
        if (!needsReload) {
          newData.browserHash = metadata.browserHash
          for (const dep in newData.chunks) {
            newData.chunks[dep].browserHash = metadata.browserHash
          }
          for (const dep in newData.optimized) {
            newData.optimized[dep].browserHash = (
              metadata.optimized[dep] || metadata.discovered[dep]
            ).browserHash
          }
        }

        // Commit hash and needsInterop changes to the discovered deps info
        // object. Allow for code to await for the discovered processing promise
        // and use the information in the same object
        for (const o in newData.optimized) {
          const discovered = metadata.discovered[o]
          if (discovered) {
            const optimized = newData.optimized[o]
            discovered.browserHash = optimized.browserHash
            discovered.fileHash = optimized.fileHash
            discovered.needsInterop = optimized.needsInterop
            discovered.processing = undefined
          }
        }

        if (isRerun) {
          newDepsToLog.push(
            ...Object.keys(newData.optimized).filter(
              (dep) => !metadata.optimized[dep]
            )
          )
        }

        metadata = optimizedDeps.metadata = newData
        resolveEnqueuedProcessingPromises()
      }

      if (!needsReload) {
        commitProcessing()

        if (!isDebugEnabled) {
          if (newDepsToLogHandle) clearTimeout(newDepsToLogHandle)
          newDepsToLogHandle = setTimeout(() => {
            newDepsToLogHandle = undefined
            logNewlyDiscoveredDeps()
          }, 2 * debounceMs)
        } else {
          debug(colors.green(`✨ optimized dependencies unchanged`), {
            timestamp: true
          })
        }
      } else {
        if (newDepsDiscovered) {
          // There are newly discovered deps, and another rerun is about to be
          // excecuted. Avoid the current full reload discarding this rerun result
          // We don't resolve the processing promise, as they will be resolved
          // once a rerun is committed
          processingResult.cancel()

          debug(
            colors.green(
              `✨ delaying reload as new dependencies have been found...`
            ),
            {
              timestamp: true
            }
          )
        } else {
          commitProcessing()

          if (!isDebugEnabled) {
            if (newDepsToLogHandle) clearTimeout(newDepsToLogHandle)
            newDepsToLogHandle = undefined
            logNewlyDiscoveredDeps()
          }

          logger.info(
            colors.green(`✨ optimized dependencies changed. reloading`),
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

  async function rerun() {
    // debounce time to wait for new missing deps finished, issue a new
    // optimization of deps (both old and newly found) once the previous
    // optimizeDeps processing is finished
    const deps = Object.keys(optimizedDeps.metadata.discovered)
    const depsString = depsLogString(deps)
    debug(colors.green(`new dependencies found: ${depsString}`), {
      timestamp: true
    })
    runOptimizer(true)
  }

  function getDiscoveredBrowserHash(
    hash: string,
    deps: Record<string, string>,
    missing: Record<string, string>
  ) {
    return getHash(
      hash + JSON.stringify(deps) + JSON.stringify(missing) + sessionTimestamp
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
    missing = addOptimizedDepInfo(metadata, 'discovered', {
      id,
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
    })

    // Debounced rerun, let other missing dependencies be discovered before
    // the running next optimizeDeps
    enqueuedRerun = undefined
    if (handle) clearTimeout(handle)
    if (newDepsToLogHandle) clearTimeout(newDepsToLogHandle)
    newDepsToLogHandle = undefined
    handle = setTimeout(() => {
      handle = undefined
      enqueuedRerun = rerun
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
