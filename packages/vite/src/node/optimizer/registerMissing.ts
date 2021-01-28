import chalk from 'chalk'
import { optimizeDeps } from '.'
import { ViteDevServer } from '..'

const debounceMs = 100

export function createMissingImpoterRegisterFn(server: ViteDevServer) {
  const { logger } = server.config
  let knownOptimized = server._optimizeDepsMetadata!.optimized
  let currentMissing: Record<string, string> = {}
  let currentImporters = new Set<string>()
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
      server._optimizeDepsMetadata = null

      const newData = (server._optimizeDepsMetadata = await optimizeDeps(
        server.config,
        true,
        false,
        newDeps
      ))
      knownOptimized = newData!.optimized

      // Importers' cached transform results have stale imports (resolved to
      // old locations) so they need to be invalidated before the page is
      // reloaded.
      currentImporters.forEach((importer) => {
        const mod = server.moduleGraph.getModuleById(importer)
        if (mod) server.moduleGraph.invalidateModule(mod)
      })
      currentImporters.clear()

      server.ws.send({
        type: 'full-reload',
        path: '*'
      })
    } catch (e) {
      logger.error(
        chalk.red(`error while updating dependencies:\n${e.stack}`),
        { timestamp: true }
      )
    } finally {
      pendingResolve && pendingResolve()
      server._pendingReload = pendingResolve = null
    }

    logger.info(chalk.greenBright(`✨ dependencies updated.`), {
      timestamp: true
    })
  }

  return function registerMissingImport(
    id: string,
    resolved: string,
    importer?: string
  ) {
    if (!knownOptimized[id]) {
      currentMissing[id] = resolved
      if (importer) currentImporters.add(importer)
      if (handle) clearTimeout(handle)
      handle = setTimeout(rerun, debounceMs)
      server._pendingReload = new Promise((r) => {
        pendingResolve = r
      })
    }
  }
}
