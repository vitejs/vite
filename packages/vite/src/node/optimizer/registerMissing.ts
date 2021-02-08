import chalk from 'chalk'
import { optimizeDeps } from '.'
import { ViteDevServer } from '..'
import { resolveSSRExternal } from '../ssr/ssrExternal'

/**
 * The amount to wait for requests to register newfound deps before triggering
 * a re-bundle + page reload
 */
const debounceMs = 100

export function createMissingImpoterRegisterFn(server: ViteDevServer) {
  const { logger } = server.config
  let knownOptimized = server._optimizeDepsMetadata!.optimized
  let currentMissing: Record<string, string> = {}
  let handle: NodeJS.Timeout

  let pendingResolve: (() => void) | null = null

  async function rerun() {
    const newDeps = currentMissing
    currentMissing = {}

    logger.info(
      chalk.yellow(
        `new dependencies found: ${Object.keys(newDeps).join(
          ', '
        )}, updating...`
      ),
      {
        timestamp: true
      }
    )

    for (const id in knownOptimized) {
      newDeps[id] = knownOptimized[id].src
    }

    try {
      // Nullify previous metadata so that the resolver won't
      // resolve to optimized files during the optimizer re-run
      server._isRunningOptimizer = true
      server._optimizeDepsMetadata = null

      const newData = (server._optimizeDepsMetadata = await optimizeDeps(
        server.config,
        true,
        false,
        newDeps
      ))
      knownOptimized = newData!.optimized

      // update ssr externals
      server._ssrExternals = resolveSSRExternal(
        server.config,
        Object.keys(knownOptimized)
      )

      logger.info(
        chalk.greenBright(`✨ dependencies updated, reloading page...`),
        { timestamp: true }
      )
    } catch (e) {
      logger.error(
        chalk.red(`error while updating dependencies:\n${e.stack}`),
        { timestamp: true }
      )
    } finally {
      server._isRunningOptimizer = false
      pendingResolve && pendingResolve()
      server._pendingReload = pendingResolve = null
    }

    // Cached transform results have stale imports (resolved to
    // old locations) so they need to be invalidated before the page is
    // reloaded.
    server.moduleGraph.invalidateAll()

    server.ws.send({
      type: 'full-reload',
      path: '*'
    })
  }

  return function registerMissingImport(id: string, resolved: string) {
    if (!knownOptimized[id]) {
      currentMissing[id] = resolved
      if (handle) clearTimeout(handle)
      handle = setTimeout(rerun, debounceMs)
      server._pendingReload = new Promise((r) => {
        pendingResolve = r
      })
    }
  }
}
