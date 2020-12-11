import fs from 'fs'
import getEtag from 'etag'
import { Connect } from '../../types/connect'
import { send } from '../send'
import { ServerContext } from '../..'
import { createDebugger, isObject } from '../../utils'
import { ModuleNode } from '../moduleGraph'
import chalk from 'chalk'
import { UpdatePayload } from '../../../hmrPayload'

export const debugHmr = createDebugger('vite:hmr')

export const HMR_CLIENT_PATH = `/vite/client`

export interface HmrOptions {
  protocol?: string
  host?: string
  port?: number
  path?: string
  timeout?: number
}

export function hmrMiddleware(
  context: ServerContext
): Connect.NextHandleFunction {
  const { watcher, config, moduleGraph } = context

  watcher.on('change', (file) => {
    // update module graph before performing update
    moduleGraph.onFileChange(file)
    handleHMRUpdate(file, context)
  })

  const clientCode = fs
    // eslint-disable-next-line
    .readFileSync(require.resolve('vite/dist/client/client.js'), 'utf-8')
    .replace(`__MODE__`, JSON.stringify(config.mode || 'development'))
    .replace(
      `__DEFINES__`,
      JSON.stringify({}) // TODO
    )
  let resolvedClientCode: string | undefined
  let etag: string | undefined

  return (req, res, next) => {
    if (req.url! === HMR_CLIENT_PATH) {
      // we need to wait until the request coming in to resolve the final
      // host/port information in the client file
      if (!resolvedClientCode) {
        // set after server listen
        const hmrConfig = isObject(config.server.hmr) ? config.server.hmr : {}
        const host = hmrConfig.host || null
        const protocol = hmrConfig.protocol || null
        const timeout = hmrConfig.timeout || 30000
        let port = String(hmrConfig.port || config.server.port!)
        if (hmrConfig.path) {
          port = `${port}/${hmrConfig.path}`
        }
        resolvedClientCode = clientCode
          .replace(`__HMR_PROTOCOL__`, JSON.stringify(protocol))
          .replace(`__HMR_HOSTNAME__`, JSON.stringify(host))
          .replace(`__HMR_PORT__`, JSON.stringify(port))
          .replace(`__HMR_TIMEOUT__`, JSON.stringify(timeout))
        etag = getEtag(resolvedClientCode, { weak: true })
      }

      return send(req, res, resolvedClientCode, 'js', etag)
    }
    next()
  }
}

function handleHMRUpdate(file: string, context: ServerContext): any {
  debugHmr(`[file change] ${chalk.dim(file)}`)

  const mods = context.moduleGraph.getModulesByFile(file)
  if (!mods) {
    // loaded but not in the module graph, probably not js
    debugHmr(`[no module entry] ${chalk.dim(file)}`)
    return
  }

  const timestamp = Date.now()
  const updates: UpdatePayload[] = []

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
        const type = `${boundary.type}-update` as UpdatePayload['type']
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
    type: 'multi',
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
