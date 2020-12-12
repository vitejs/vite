import path from 'path'
import { ServerContext } from '..'
import { createDebugger } from '../utils'
import { ModuleNode } from './moduleGraph'
import chalk from 'chalk'
import { Update } from '../../hmrPayload'
import slash from 'slash'

export const debugHmr = createDebugger('vite:hmr')

export interface HmrOptions {
  protocol?: string
  host?: string
  port?: number
  path?: string
  timeout?: number
  overlay?: boolean
}

export function handleHMRUpdate(file: string, context: ServerContext): any {
  debugHmr(`[file change] ${chalk.dim(file)}`)

  if (file === context.config.configPath) {
    // TODO auto restart server
    return
  }

  if (file.endsWith('.env')) {
    // TODO notification for manual server restart
    return
  }

  if (file.endsWith('.html')) {
    context.ws.send({
      type: 'full-reload',
      path: '/' + slash(path.relative(context.config.root, file))
    })
    return
  }

  const mods = context.moduleGraph.getModulesByFile(file)
  if (!mods) {
    // loaded but not in the module graph, probably not js
    debugHmr(`[no module entry] ${chalk.dim(file)}`)
    return
  }

  const timestamp = Date.now()
  const updates: Update[] = []

  for (const mod of mods) {
    const boundaries = new Set<ModuleNode>()
    const hasDeadEnd = propagateUpdate(mod, timestamp, boundaries)
    if (hasDeadEnd) {
      debugHmr(`[full reload] ${chalk.dim(file)}`)
      context.ws.send({
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

  context.ws.send({
    type: 'update',
    updates
  })
}

function propagateUpdate(
  node: ModuleNode,
  timestamp: number,
  boundaries: Set<ModuleNode>,
  currentChain: ModuleNode[] = [node]
): boolean /* hasDeadEnd */ {
  if (node.isHmrBoundary) {
    boundaries.add(node)
    // mark current propagation chain dirty.
    // timestamp is used for injecting timestamp query during rewrite
    // also invalidate cache
    currentChain.forEach((node) => {
      node.lastHMRTimestamp = timestamp
      node.transformResult = null
    })
    return false
  }

  if (!node.importers.size) {
    return true
  }

  for (const importer of node.importers) {
    // TODO need dep acceptance check
    if (!currentChain.includes(importer)) {
      if (
        propagateUpdate(
          importer,
          timestamp,
          boundaries,
          currentChain.concat(importer)
        )
      ) {
        return true
      }
    }
  }
  return false
}
