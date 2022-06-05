import colors from 'picocolors'
import _debug from 'debug'
import { getHash } from '../utils'
import type { ResolvedConfig, ViteDevServer } from '..'
import {
  addOptimizedDepInfo,
  createIsOptimizedDepUrl,
  debuggerViteDeps as debug,
  depsFromOptimizedDepInfo,
  depsLogString,
  discoverProjectDependencies,
  extractExportsData,
  getOptimizedDepPath,
  initDepsOptimizerMetadata,
  initialProjectDependencies,
  isOptimizedDepFile,
  loadCachedDepOptimizationMetadata,
  newDepOptimizationProcessing,
  runOptimizeDeps
} from '.'
import type {
  DepOptimizationProcessing,
  DepsOptimizer,
  OptimizedDepInfo
} from '.'

const isDebugEnabled = _debug('vite:deps').enabled

/**
 * The amount to wait for requests to register newly found dependencies before triggering
 * a re-bundle + page reload
 */
const debounceMs = 100

const depsOptimizerMap = new WeakMap<ResolvedConfig, DepsOptimizer>()

export function getDepsOptimizer(
  config: ResolvedConfig
): DepsOptimizer | undefined {
  // Workers compilation shares the DepsOptimizer from the main build
  return depsOptimizerMap.get(config.mainConfig || config)
}

export async function initDepsOptimizer(
  config: ResolvedConfig,
  server?: ViteDevServer
): Promise<DepsOptimizer> {
  const { logger } = config
  const isBuild = config.command === 'build'

  const scan = config.command !== 'build' && config.optimizeDeps.devScan

  const sessionTimestamp = Date.now().toString()

  const cachedMetadata = loadCachedDepOptimizationMetadata(config)

  let handle: NodeJS.Timeout | undefined

  const depsOptimizer: DepsOptimizer = {
    metadata:
      cachedMetadata || initDepsOptimizerMetadata(config, sessionTimestamp),
    registerMissingImport,
    run: () => debouncedProcessing(0),
    isOptimizedDepFile: (id: string) => isOptimizedDepFile(id, config),
    isOptimizedDepUrl: createIsOptimizedDepUrl(config),
    getOptimizedDepId: (depInfo: OptimizedDepInfo) =>
      isBuild ? depInfo.file : `${depInfo.file}?v=${depInfo.browserHash}`,
    options: config.optimizeDeps
  }

  depsOptimizerMap.set(config, depsOptimizer)

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

  // If there wasn't a cache or it is outdated, we need to prepare a first run
  let firstRunCalled = !!cachedMetadata
  if (!cachedMetadata) {
    if (!scan) {
      // Initialize discovered deps with manually added optimizeDeps.include info
      const discovered = await initialProjectDependencies(
        config,
        sessionTimestamp
      )
      const { metadata } = depsOptimizer
      for (const depInfo of Object.values(discovered)) {
        addOptimizedDepInfo(metadata, 'discovered', {
          ...depInfo,
          processing: depOptimizationProcessing.promise
        })
      }
    } else {
      // Perform a esbuild base scan of user code to discover dependencies
      currentlyProcessing = true

      const scanPhaseProcessing = newDepOptimizationProcessing()
      depsOptimizer.scanProcessing = scanPhaseProcessing.promise

      setTimeout(async () => {
        try {
          debug(colors.green(`scanning for dependencies...`), {
            timestamp: true
          })

          const { metadata } = depsOptimizer

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
          depsOptimizer.scanProcessing = undefined

          await runOptimizer()
        } catch (e) {
          logger.error(e.message)
          if (depsOptimizer.scanProcessing) {
            scanPhaseProcessing.resolve()
            depsOptimizer.scanProcessing = undefined
          }
        }
      }, 0)
    }
  }

  async function runOptimizer() {
    const isRerun = firstRunCalled
    firstRunCalled = true

    // Ensure that rerun is called sequentially
    enqueuedRerun = undefined

    // Ensure that a rerun will not be issued for current discovered deps
    if (handle) clearTimeout(handle)

    if (Object.keys(depsOptimizer.metadata.discovered).length === 0) {
      currentlyProcessing = false
      return
    }

    currentlyProcessing = true

    // a succesful completion of the optimizeDeps rerun will end up
    // creating new bundled version of all current and discovered deps
    // in the cache dir and a new metadata info object assigned
    // to optimizeDeps.metadata. A fullReload is only issued if
    // the previous bundled dependencies have changed.

    // if the rerun fails, optimizeDeps.metadata remains untouched,
    // current discovered deps are cleaned, and a fullReload is issued

    let { metadata } = depsOptimizer

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

      const needsInteropMismatch = []
      for (const dep in metadata.discovered) {
        const discoveredDepInfo = metadata.discovered[dep]
        const depInfo = newData.optimized[dep]
        if (depInfo) {
          if (
            discoveredDepInfo.needsInterop !== undefined &&
            depInfo.needsInterop !== discoveredDepInfo.needsInterop
          ) {
            // This only happens when a discovered dependency has mixed ESM and CJS syntax
            // and it hasn't been manually added to optimizeDeps.needsInterop
            needsInteropMismatch.push(dep)
          }
        }
      }

      // After a re-optimization, if the internal bundled chunks change a full page reload
      // is required. If the files are stable, we can avoid the reload that is expensive
      // for large applications. Comparing their fileHash we can find out if it is safe to
      // keep the current browser state.
      const needsReload =
        needsInteropMismatch.length > 0 ||
        metadata.hash !== newData.hash ||
        Object.keys(metadata.optimized).some((dep) => {
          return (
            metadata.optimized[dep].fileHash !== newData.optimized[dep].fileHash
          )
        })

      const commitProcessing = async () => {
        await processingResult.commit()

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

        metadata = depsOptimizer.metadata = newData
        resolveEnqueuedProcessingPromises()
      }

      if (!needsReload) {
        await commitProcessing()

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
          await commitProcessing()

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
          if (needsInteropMismatch.length > 0) {
            config.logger.warn(
              `Mixed ESM and CJS detected in ${colors.yellow(
                needsInteropMismatch.join(', ')
              )}, add ${
                needsInteropMismatch.length === 1 ? 'it' : 'them'
              } to optimizeDeps.needsInterop to speed up cold start`,
              {
                timestamp: true
              }
            )
          }

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
    }

    currentlyProcessing = false
    // @ts-ignore
    enqueuedRerun?.()
  }

  function fullReload() {
    if (server) {
      // Cached transform results have stale imports (resolved to
      // old locations) so they need to be invalidated before the page is
      // reloaded.
      server.moduleGraph.invalidateAll()

      server.ws.send({
        type: 'full-reload',
        path: '*'
      })
    }
  }

  async function rerun() {
    // debounce time to wait for new missing deps finished, issue a new
    // optimization of deps (both old and newly found) once the previous
    // optimizeDeps processing is finished
    const deps = Object.keys(depsOptimizer.metadata.discovered)
    const depsString = depsLogString(deps)
    debug(colors.green(`new dependencies found: ${depsString}`), {
      timestamp: true
    })
    runOptimizer()
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
    if (depsOptimizer.scanProcessing) {
      config.logger.error(
        'Vite internal error: registering missing import before initial scanning is over'
      )
    }
    const { metadata } = depsOptimizer
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
      file: getOptimizedDepPath(id, config),
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
      processing: depOptimizationProcessing.promise,
      exportsData: extractExportsData(resolved, config)
    })

    // Until the first optimize run is called, avoid triggering processing
    // We'll wait until the user codebase is eagerly processed by Vite so
    // we can get a list of every missing dependency before giving to the
    // browser a dependency that may be outdated, thus avoiding full page reloads

    if (scan || firstRunCalled) {
      // Debounced rerun, let other missing dependencies be discovered before
      // the running next optimizeDeps
      debouncedProcessing()
    }

    // Return the path for the optimized bundle, this path is known before
    // esbuild is run to generate the pre-bundle
    return missing
  }

  function debouncedProcessing(timeout = debounceMs) {
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
    }, timeout)
  }

  return depsOptimizer
}
