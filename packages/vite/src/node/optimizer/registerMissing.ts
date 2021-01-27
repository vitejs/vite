import chalk from 'chalk'
import { optimizeDeps } from '.'
import { ViteDevServer } from '..'

const debounceMs = 100

export function createMissingImpoterRegisterFn(server: ViteDevServer) {
  const { logger } = server.config
  let knownOptimized = server._optimizeDepsMetadata!.optimized
  let currentMissing: Record<string, string> = {}
  let handle: NodeJS.Timeout

  async function rerun() {
    const newDeps = currentMissing
    currentMissing = {}

    for (const id in knownOptimized) {
      newDeps[id] = knownOptimized[id].src
    }

    logger.info(
      chalk.yellow(`new imports encountered, updating dependencies...`),
      {
        timestamp: true
      }
    )

    try {
      const newData = (server._optimizeDepsMetadata = await optimizeDeps(
        server.config,
        true,
        false,
        newDeps
      ))
      knownOptimized = newData!.optimized
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
      server._hasPendingReload = false
    }

    logger.info(chalk.greenBright(`✨ dependencies updated.`), {
      timestamp: true
    })
  }

  return function registerMissingImport(id: string, resolved: string) {
    if (!knownOptimized[id]) {
      currentMissing[id] = resolved
      if (handle) clearTimeout(handle)
      handle = setTimeout(rerun, debounceMs)
      server._hasPendingReload = true
    }
  }
}
