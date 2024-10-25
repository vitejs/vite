import colors from 'picocolors'
import { createDebugger, getHash, promiseWithResolvers } from '../utils'
import type { PromiseWithResolvers } from '../utils'
import type { DevEnvironment } from '../server/environment'
import { devToScanEnvironment } from './scan'
import {
  addManuallyIncludedOptimizeDeps,
  addOptimizedDepInfo,
  createIsOptimizedDepFile,
  createIsOptimizedDepUrl,
  depsFromOptimizedDepInfo,
  depsLogString,
  discoverProjectDependencies,
  extractExportsData,
  getOptimizedDepPath,
  initDepsOptimizerMetadata,
  loadCachedDepOptimizationMetadata,
  optimizeExplicitEnvironmentDeps,
  runOptimizeDeps,
  toDiscoveredDependencies,
} from './index'
import type {
  DepOptimizationMetadata,
  DepOptimizationResult,
  DepsOptimizer,
  OptimizedDepInfo,
} from './index'

const debug = createDebugger('vite:deps')

/**
 * The amount to wait for requests to register newly found dependencies before triggering
 * a re-bundle + page reload
 */
const debounceMs = 100

export function createDepsOptimizer(
  environment: DevEnvironment,
): DepsOptimizer {
  const { logger } = environment
  const sessionTimestamp = Date.now().toString()

  let debounceProcessingHandle: NodeJS.Timeout | undefined

  let closed = false

  const options = environment.config.dev.optimizeDeps

  const { noDiscovery, holdUntilCrawlEnd } = options

  let metadata: DepOptimizationMetadata = initDepsOptimizerMetadata(
    environment,
    sessionTimestamp,
  )

  const depsOptimizer: DepsOptimizer = {
    init,
    metadata,
    registerMissingImport,
    run: () => debouncedProcessing(0),
    isOptimizedDepFile: createIsOptimizedDepFile(environment),
    isOptimizedDepUrl: createIsOptimizedDepUrl(environment),
    getOptimizedDepId: (depInfo: OptimizedDepInfo) =>
      `${depInfo.file}?v=${depInfo.browserHash}`,
    close,
    options,
  }

  let newDepsDiscovered = false

  let newDepsToLog: string[] = []
  let newDepsToLogHandle: NodeJS.Timeout | undefined
  const logNewlyDiscoveredDeps = () => {
    if (newDepsToLog.length) {
      logger.info(
        colors.green(
          `✨ new dependencies optimized: ${depsLogString(newDepsToLog)}`,
        ),
        {
          timestamp: true,
        },
      )
      newDepsToLog = []
    }
  }

  let discoveredDepsWhileScanning: string[] = []
  const logDiscoveredDepsWhileScanning = () => {
    if (discoveredDepsWhileScanning.length) {
      logger.info(
        colors.green(
          `✨ discovered while scanning: ${depsLogString(
            discoveredDepsWhileScanning,
          )}`,
        ),
        {
          timestamp: true,
        },
      )
      discoveredDepsWhileScanning = []
    }
  }

  let depOptimizationProcessing = promiseWithResolvers<void>()
  let depOptimizationProcessingQueue: PromiseWithResolvers<void>[] = []
  const resolveEnqueuedProcessingPromises = () => {
    // Resolve all the processings (including the ones which were delayed)
    for (const processing of depOptimizationProcessingQueue) {
      processing.resolve()
    }
    depOptimizationProcessingQueue = []
  }

  let enqueuedRerun: (() => void) | undefined
  let currentlyProcessing = false

  let firstRunCalled = false
  let warnAboutMissedDependencies = false

  // If this is a cold run, we wait for static imports discovered
  // from the first request before resolving to minimize full page reloads.
  // On warm start or after the first optimization is run, we use a simpler
  // debounce strategy each time a new dep is discovered.
  let waitingForCrawlEnd = false

  let optimizationResult:
    | {
        cancel: () => Promise<void>
        result: Promise<DepOptimizationResult>
      }
    | undefined

  let discover:
    | {
        cancel: () => Promise<void>
        result: Promise<Record<string, string>>
      }
    | undefined

  async function close() {
    closed = true
    await Promise.allSettled([
      discover?.cancel(),
      depsOptimizer.scanProcessing,
      optimizationResult?.cancel(),
    ])
  }

  let inited = false
  async function init() {
    if (inited) return
    inited = true

    const cachedMetadata = await loadCachedDepOptimizationMetadata(environment)

    firstRunCalled = !!cachedMetadata

    metadata = depsOptimizer.metadata =
      cachedMetadata || initDepsOptimizerMetadata(environment, sessionTimestamp)

    if (!cachedMetadata) {
      environment.waitForRequestsIdle().then(onCrawlEnd)
      waitingForCrawlEnd = true

      // Enter processing state until crawl of static imports ends
      currentlyProcessing = true

      // Initialize discovered deps with manually added optimizeDeps.include info

      const manuallyIncludedDeps: Record<string, string> = {}
      await addManuallyIncludedOptimizeDeps(environment, manuallyIncludedDeps)

      const manuallyIncludedDepsInfo = toDiscoveredDependencies(
        environment,
        manuallyIncludedDeps,
        sessionTimestamp,
      )

      for (const depInfo of Object.values(manuallyIncludedDepsInfo)) {
        addOptimizedDepInfo(metadata, 'discovered', {
          ...depInfo,
          processing: depOptimizationProcessing.promise,
        })
        newDepsDiscovered = true
      }

      if (noDiscovery) {
        // We don't need to scan for dependencies or wait for the static crawl to end
        // Run the first optimization run immediately
        runOptimizer()
      } else {
        // Important, the scanner is dev only
        depsOptimizer.scanProcessing = new Promise((resolve) => {
          // Runs in the background in case blocking high priority tasks
          ;(async () => {
            try {
              debug?.(colors.green(`scanning for dependencies...`))

              discover = discoverProjectDependencies(
                devToScanEnvironment(environment),
              )
              const deps = await discover.result
              discover = undefined

              const manuallyIncluded = Object.keys(manuallyIncludedDepsInfo)
              discoveredDepsWhileScanning.push(
                ...Object.keys(metadata.discovered).filter(
                  (dep) => !deps[dep] && !manuallyIncluded.includes(dep),
                ),
              )

              // Add these dependencies to the discovered list, as these are currently
              // used by the preAliasPlugin to support aliased and optimized deps.
              // This is also used by the CJS externalization heuristics in legacy mode
              for (const id of Object.keys(deps)) {
                if (!metadata.discovered[id]) {
                  addMissingDep(id, deps[id])
                }
              }

              const knownDeps = prepareKnownDeps()
              startNextDiscoveredBatch()

              // For dev, we run the scanner and the first optimization
              // run on the background
              optimizationResult = runOptimizeDeps(environment, knownDeps)

              // If the holdUntilCrawlEnd strategy is used, we wait until crawling has
              // ended to decide if we send this result to the browser or we need to
              // do another optimize step
              if (!holdUntilCrawlEnd) {
                // If not, we release the result to the browser as soon as the scanner
                // is done. If the scanner missed any dependency, and a new dependency
                // is discovered while crawling static imports, then there will be a
                // full-page reload if new common chunks are generated between the old
                // and new optimized deps.
                optimizationResult.result.then((result) => {
                  // Check if the crawling of static imports has already finished. In that
                  // case, the result is handled by the onCrawlEnd callback
                  if (!waitingForCrawlEnd) return

                  optimizationResult = undefined // signal that we'll be using the result

                  runOptimizer(result)
                })
              }
            } catch (e) {
              logger.error(e.stack || e.message)
            } finally {
              resolve()
              depsOptimizer.scanProcessing = undefined
            }
          })()
        })
      }
    }
  }

  function startNextDiscoveredBatch() {
    newDepsDiscovered = false

    // Add the current depOptimizationProcessing to the queue, these
    // promises are going to be resolved once a rerun is committed
    depOptimizationProcessingQueue.push(depOptimizationProcessing)

    // Create a new promise for the next rerun, discovered missing
    // dependencies will be assigned this promise from this point
    depOptimizationProcessing = promiseWithResolvers()
  }

  function prepareKnownDeps() {
    const knownDeps: Record<string, OptimizedDepInfo> = {}
    // Clone optimized info objects, fileHash, browserHash may be changed for them
    const metadata = depsOptimizer.metadata!
    for (const dep of Object.keys(metadata.optimized)) {
      knownDeps[dep] = { ...metadata.optimized[dep] }
    }
    for (const dep of Object.keys(metadata.discovered)) {
      // Clone the discovered info discarding its processing promise
      const { processing, ...info } = metadata.discovered[dep]
      knownDeps[dep] = info
    }
    return knownDeps
  }

  async function runOptimizer(preRunResult?: DepOptimizationResult) {
    // a successful completion of the optimizeDeps rerun will end up
    // creating new bundled version of all current and discovered deps
    // in the cache dir and a new metadata info object assigned
    // to _metadata. A fullReload is only issued if the previous bundled
    // dependencies have changed.

    // if the rerun fails, _metadata remains untouched, current discovered
    // deps are cleaned, and a fullReload is issued

    // All deps, previous known and newly discovered are rebundled,
    // respect insertion order to keep the metadata file stable

    const isRerun = firstRunCalled
    firstRunCalled = true

    // Ensure that rerun is called sequentially
    enqueuedRerun = undefined

    // Ensure that a rerun will not be issued for current discovered deps
    if (debounceProcessingHandle) clearTimeout(debounceProcessingHandle)

    if (closed) {
      currentlyProcessing = false
      return
    }

    currentlyProcessing = true

    try {
      let processingResult: DepOptimizationResult
      if (preRunResult) {
        processingResult = preRunResult
      } else {
        const knownDeps = prepareKnownDeps()
        startNextDiscoveredBatch()

        optimizationResult = runOptimizeDeps(environment, knownDeps)
        processingResult = await optimizationResult.result
        optimizationResult = undefined
      }

      if (closed) {
        currentlyProcessing = false
        processingResult.cancel()
        resolveEnqueuedProcessingPromises()
        return
      }

      const newData = processingResult.metadata

      const needsInteropMismatch = findInteropMismatches(
        metadata.discovered,
        newData.optimized,
      )

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
              (dep) => !metadata.optimized[dep],
            ),
          )
        }

        metadata = depsOptimizer.metadata = newData
        resolveEnqueuedProcessingPromises()
      }

      if (!needsReload) {
        await commitProcessing()

        if (!debug) {
          if (newDepsToLogHandle) clearTimeout(newDepsToLogHandle)
          newDepsToLogHandle = setTimeout(() => {
            newDepsToLogHandle = undefined
            logNewlyDiscoveredDeps()
            if (warnAboutMissedDependencies) {
              logDiscoveredDepsWhileScanning()
              logger.info(
                colors.magenta(
                  `❗ add these dependencies to optimizeDeps.include to speed up cold start`,
                ),
                { timestamp: true },
              )
              warnAboutMissedDependencies = false
            }
          }, 2 * debounceMs)
        } else {
          debug(
            colors.green(
              `✨ ${
                !isRerun
                  ? `dependencies optimized`
                  : `optimized dependencies unchanged`
              }`,
            ),
          )
        }
      } else {
        if (newDepsDiscovered) {
          // There are newly discovered deps, and another rerun is about to be
          // executed. Avoid the current full reload discarding this rerun result
          // We don't resolve the processing promise, as they will be resolved
          // once a rerun is committed
          processingResult.cancel()

          debug?.(
            colors.green(
              `✨ delaying reload as new dependencies have been found...`,
            ),
          )
        } else {
          await commitProcessing()

          if (!debug) {
            if (newDepsToLogHandle) clearTimeout(newDepsToLogHandle)
            newDepsToLogHandle = undefined
            logNewlyDiscoveredDeps()
            if (warnAboutMissedDependencies) {
              logDiscoveredDepsWhileScanning()
              logger.info(
                colors.magenta(
                  `❗ add these dependencies to optimizeDeps.include to avoid a full page reload during cold start`,
                ),
                { timestamp: true },
              )
              warnAboutMissedDependencies = false
            }
          }

          logger.info(
            colors.green(`✨ optimized dependencies changed. reloading`),
            {
              timestamp: true,
            },
          )
          if (needsInteropMismatch.length > 0) {
            logger.warn(
              `Mixed ESM and CJS detected in ${colors.yellow(
                needsInteropMismatch.join(', '),
              )}, add ${
                needsInteropMismatch.length === 1 ? 'it' : 'them'
              } to optimizeDeps.needsInterop to speed up cold start`,
              {
                timestamp: true,
              },
            )
          }

          fullReload()
        }
      }
    } catch (e) {
      logger.error(
        colors.red(`error while updating dependencies:\n${e.stack}`),
        { timestamp: true, error: e },
      )
      resolveEnqueuedProcessingPromises()

      // Reset missing deps, let the server rediscover the dependencies
      metadata.discovered = {}
    }

    currentlyProcessing = false
    // @ts-expect-error `enqueuedRerun` could exist because `debouncedProcessing` may run while awaited
    enqueuedRerun?.()
  }

  function fullReload() {
    // Cached transform results have stale imports (resolved to
    // old locations) so they need to be invalidated before the page is
    // reloaded.
    environment.moduleGraph.invalidateAll()

    environment.hot.send({
      type: 'full-reload',
      path: '*',
    })
  }

  async function rerun() {
    // debounce time to wait for new missing deps finished, issue a new
    // optimization of deps (both old and newly found) once the previous
    // optimizeDeps processing is finished
    const deps = Object.keys(metadata.discovered)
    const depsString = depsLogString(deps)
    debug?.(colors.green(`new dependencies found: ${depsString}`))
    runOptimizer()
  }

  function getDiscoveredBrowserHash(
    hash: string,
    deps: Record<string, string>,
    missing: Record<string, string>,
  ) {
    return getHash(
      hash + JSON.stringify(deps) + JSON.stringify(missing) + sessionTimestamp,
    )
  }

  function registerMissingImport(
    id: string,
    resolved: string,
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

    missing = addMissingDep(id, resolved)

    // Until the first optimize run is called, avoid triggering processing
    // We'll wait until the user codebase is eagerly processed by Vite so
    // we can get a list of every missing dependency before giving to the
    // browser a dependency that may be outdated, thus avoiding full page reloads

    if (!waitingForCrawlEnd) {
      // Debounced rerun, let other missing dependencies be discovered before
      // the running next optimizeDeps
      debouncedProcessing()
    }

    // Return the path for the optimized bundle, this path is known before
    // esbuild is run to generate the pre-bundle
    return missing
  }

  function addMissingDep(id: string, resolved: string) {
    newDepsDiscovered = true

    return addOptimizedDepInfo(metadata, 'discovered', {
      id,
      file: getOptimizedDepPath(environment, id),
      src: resolved,
      // Adding a browserHash to this missing dependency that is unique to
      // the current state of known + missing deps. If its optimizeDeps run
      // doesn't alter the bundled files of previous known dependencies,
      // we don't need a full reload and this browserHash will be kept
      browserHash: getDiscoveredBrowserHash(
        metadata.hash,
        depsFromOptimizedDepInfo(metadata.optimized),
        depsFromOptimizedDepInfo(metadata.discovered),
      ),
      // loading of this pre-bundled dep needs to await for its processing
      // promise to be resolved
      processing: depOptimizationProcessing.promise,
      exportsData: extractExportsData(environment, resolved),
    })
  }

  function debouncedProcessing(timeout = debounceMs) {
    // Debounced rerun, let other missing dependencies be discovered before
    // the next optimizeDeps run
    enqueuedRerun = undefined
    if (debounceProcessingHandle) clearTimeout(debounceProcessingHandle)
    if (newDepsToLogHandle) clearTimeout(newDepsToLogHandle)
    newDepsToLogHandle = undefined
    debounceProcessingHandle = setTimeout(() => {
      debounceProcessingHandle = undefined
      enqueuedRerun = rerun
      if (!currentlyProcessing) {
        enqueuedRerun()
      }
    }, timeout)
  }

  // onCrawlEnd is called once when the server starts and all static
  // imports after the first request have been crawled (dynamic imports may also
  // be crawled if the browser requests them right away).
  async function onCrawlEnd() {
    // switch after this point to a simple debounce strategy
    waitingForCrawlEnd = false

    debug?.(colors.green(`✨ static imports crawl ended`))
    if (closed) {
      return
    }

    // Await for the scan+optimize step running in the background
    // It normally should be over by the time crawling of user code ended
    await depsOptimizer.scanProcessing

    if (optimizationResult && !options.noDiscovery) {
      // In the holdUntilCrawlEnd strategy, we don't release the result of the
      // post-scanner optimize step to the browser until we reach this point
      // If there are new dependencies, we do another optimize run, if not, we
      // use the post-scanner optimize result
      // If holdUntilCrawlEnd is false and we reach here, it means that the
      // scan+optimize step finished after crawl end. We follow the same
      // process as in the holdUntilCrawlEnd in this case.
      const afterScanResult = optimizationResult.result
      optimizationResult = undefined // signal that we'll be using the result

      const result = await afterScanResult
      currentlyProcessing = false

      const crawlDeps = Object.keys(metadata.discovered)
      const scanDeps = Object.keys(result.metadata.optimized)

      if (scanDeps.length === 0 && crawlDeps.length === 0) {
        debug?.(
          colors.green(
            `✨ no dependencies found by the scanner or crawling static imports`,
          ),
        )
        // We still commit the result so the scanner isn't run on the next cold start
        // for projects without dependencies
        startNextDiscoveredBatch()
        runOptimizer(result)
        return
      }

      const needsInteropMismatch = findInteropMismatches(
        metadata.discovered,
        result.metadata.optimized,
      )
      const scannerMissedDeps = crawlDeps.some((dep) => !scanDeps.includes(dep))
      const outdatedResult =
        needsInteropMismatch.length > 0 || scannerMissedDeps

      if (outdatedResult) {
        // Drop this scan result, and perform a new optimization to avoid a full reload
        result.cancel()

        // Add deps found by the scanner to the discovered deps while crawling
        for (const dep of scanDeps) {
          if (!crawlDeps.includes(dep)) {
            addMissingDep(dep, result.metadata.optimized[dep].src!)
          }
        }
        if (scannerMissedDeps) {
          debug?.(
            colors.yellow(
              `✨ new dependencies were found while crawling that weren't detected by the scanner`,
            ),
          )
        }
        debug?.(colors.green(`✨ re-running optimizer`))
        debouncedProcessing(0)
      } else {
        debug?.(
          colors.green(
            `✨ using post-scan optimizer result, the scanner found every used dependency`,
          ),
        )
        startNextDiscoveredBatch()
        runOptimizer(result)
      }
    } else if (!holdUntilCrawlEnd) {
      // The post-scanner optimize result has been released to the browser
      // If new deps have been discovered, issue a regular rerun of the
      // optimizer. A full page reload may still be avoided if the new
      // optimize result is compatible in this case
      if (newDepsDiscovered) {
        debug?.(
          colors.green(
            `✨ new dependencies were found while crawling static imports, re-running optimizer`,
          ),
        )
        warnAboutMissedDependencies = true
        debouncedProcessing(0)
      }
    } else {
      const crawlDeps = Object.keys(metadata.discovered)
      currentlyProcessing = false

      if (crawlDeps.length === 0) {
        debug?.(
          colors.green(
            `✨ no dependencies found while crawling the static imports`,
          ),
        )
        firstRunCalled = true
      }

      // queue the first optimizer run, even without deps so the result is cached
      debouncedProcessing(0)
    }
  }

  return depsOptimizer
}

export function createExplicitDepsOptimizer(
  environment: DevEnvironment,
): DepsOptimizer {
  const depsOptimizer = {
    metadata: initDepsOptimizerMetadata(environment),
    isOptimizedDepFile: createIsOptimizedDepFile(environment),
    isOptimizedDepUrl: createIsOptimizedDepUrl(environment),
    getOptimizedDepId: (depInfo: OptimizedDepInfo) =>
      `${depInfo.file}?v=${depInfo.browserHash}`,

    registerMissingImport: () => {
      throw new Error(
        `Vite Internal Error: registerMissingImport is not supported in dev ${environment.name}`,
      )
    },
    init,
    // noop, there is no scanning during dev SSR
    // the optimizer blocks the server start
    run: () => {},

    close: async () => {},
    options: environment.config.dev.optimizeDeps,
  }

  let inited = false
  async function init() {
    if (inited) return
    inited = true

    depsOptimizer.metadata = await optimizeExplicitEnvironmentDeps(environment)
  }

  return depsOptimizer
}

function findInteropMismatches(
  discovered: Record<string, OptimizedDepInfo>,
  optimized: Record<string, OptimizedDepInfo>,
) {
  const needsInteropMismatch = []
  for (const dep in discovered) {
    const discoveredDepInfo = discovered[dep]
    if (discoveredDepInfo.needsInterop === undefined) continue

    const depInfo = optimized[dep]
    if (!depInfo) continue

    if (depInfo.needsInterop !== discoveredDepInfo.needsInterop) {
      // This only happens when a discovered dependency has mixed ESM and CJS syntax
      // and it hasn't been manually added to optimizeDeps.needsInterop
      needsInteropMismatch.push(dep)
      debug?.(colors.cyan(`✨ needsInterop mismatch detected for ${dep}`))
    }
  }
  return needsInteropMismatch
}
