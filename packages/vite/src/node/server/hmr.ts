import path from 'path'
import { ViteDevServer } from '..'
import { createDebugger } from '../utils'
import { ModuleNode } from './moduleGraph'
import chalk from 'chalk'
import slash from 'slash'
import { Update } from 'types/hmrPayload'
import { CLIENT_DIR } from '../constants'

export const debugHmr = createDebugger('vite:hmr')

export interface HmrOptions {
  protocol?: string
  host?: string
  port?: number
  path?: string
  timeout?: number
  overlay?: boolean
}

export async function handleHMRUpdate(
  file: string,
  server: ViteDevServer
): Promise<any> {
  const { ws, config, moduleGraph } = server

  if (file === config.configPath) {
    // TODO auto restart server
    debugHmr(`[config change] ${chalk.dim(file)}`)
    return
  }

  if (file.endsWith('.env')) {
    // TODO notification for manual server restart
    debugHmr(`[.env change] ${chalk.dim(file)}`)
    return
  }

  debugHmr(`[file change] ${chalk.dim(file)}`)

  // html files and the client itself cannot be hot updated.
  if (file.endsWith('.html') || file.startsWith(CLIENT_DIR)) {
    ws.send({
      type: 'full-reload',
      path: '/' + slash(path.relative(config.root, file))
    })
    return
  }

  let mods = moduleGraph.getModulesByFile(file)
  if (!mods) {
    // loaded but not in the module graph, probably not js
    debugHmr(`[no module entry] ${chalk.dim(file)}`)
    return
  }

  // check if any plugin wants to perform custom HMR handling
  let filteredMods = [...mods]
  for (const plugin of config.plugins) {
    if (plugin.handleHotUpdate) {
      filteredMods =
        (await plugin.handleHotUpdate(file, filteredMods, server)) ||
        filteredMods
    }
  }

  const timestamp = Date.now()
  const updates: Update[] = []

  for (const mod of filteredMods) {
    const boundaries = new Set<ModuleNode>()
    const hasDeadEnd = propagateUpdate(mod, timestamp, boundaries)
    if (hasDeadEnd) {
      debugHmr(`[full reload] ${chalk.dim(file)}`)
      ws.send({
        type: 'full-reload'
      })
      return
    }

    updates.push(
      ...[...boundaries].map((boundary) => {
        const type = `${boundary.type}-update` as Update['type']
        debugHmr(`[${type}] ${chalk.dim(boundary.url)}`)
        return {
          type,
          timestamp,
          path: boundary.url,
          changedPath: mod.url
        }
      })
    )
  }

  ws.send({
    type: 'update',
    updates
  })
}

export function handlePrunedModules(
  mods: Set<ModuleNode>,
  { ws }: ViteDevServer
) {
  // update the disposed modules' hmr timestamp
  // since if it's re-imported, it should re-apply side effects
  // and without the timestamp the browser will not re-import it!
  const t = Date.now()
  mods.forEach((mod) => {
    mod.lastHMRTimestamp = t
    debugHmr(`[dispose] ${chalk.dim(mod.file)}`)
  })
  ws.send({
    type: 'prune',
    paths: [...mods].map((m) => m.url)
  })
}

function propagateUpdate(
  node: ModuleNode,
  timestamp: number,
  boundaries: Set<ModuleNode>,
  currentChain: ModuleNode[] = [node]
): boolean /* hasDeadEnd */ {
  if (node.isSelfAccepting) {
    boundaries.add(node)
    // mark current propagation chain dirty.
    // timestamp is used for injecting timestamp query during rewrite
    // also invalidate cache
    invalidateChain(currentChain, timestamp)
    return false
  }

  if (!node.importers.size) {
    return true
  }

  for (const importer of node.importers) {
    const subChain = currentChain.concat(importer)
    if (importer.acceptedHmrDeps.has(node)) {
      boundaries.add(importer)
      invalidateChain(subChain, timestamp)
      continue
    }

    if (!currentChain.includes(importer)) {
      if (propagateUpdate(importer, timestamp, boundaries, subChain)) {
        return true
      }
    }
  }
  return false
}

function invalidateChain(chain: ModuleNode[], timestamp: number) {
  chain.forEach((node) => {
    node.lastHMRTimestamp = timestamp
    node.transformResult = null
  })
}
