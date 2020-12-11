import fs from 'fs'
import _debug from 'debug'
import getEtag from 'etag'
import { NextHandleFunction } from 'connect'
import { send } from '../send'
import { ServerContext } from '../..'
import { isObject, prettifyUrl } from '../../utils'
import { isCSSRequest } from '../../plugins/css'
import chalk from 'chalk'

export const debugHmr = _debug('vite:hmr')

export const HMR_CLIENT_PATH = `/vite/client`

export interface HmrOptions {
  protocol?: string
  host?: string
  port?: number
  path?: string
  timeout?: number
}

export function hmrMiddleware(context: ServerContext): NextHandleFunction {
  const { watcher, config } = context

  watcher.on('change', (file) => {
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

  const url = context.fileToUrlMap.get(file)
  if (!url) {
    // file probably never been loaded
    debugHmr(`[no matching url] ${chalk.dim(file)}`)
    return
  }

  const prettyUrl = prettifyUrl(url, context.config.root)
  const mod = moduleGraph.get(url)
  if (!mod) {
    // loaded but not in the module graph, probably not js
    debugHmr(`[no module entry] ${prettyUrl}`)
    return
  }

  const boundaries = traceModuleGraph(mod)
  if (boundaries) {
    context.ws.send({
      type: 'multi',
      updates: [...boundaries].map((boundary) => {
        const updateUrl = boundary.url
        // TODO differentiate css js
        const type = isCSSRequest(updateUrl) ? 'style-update' : 'js-update'
        debugHmr(`[${type}] ${boundary.url}`)
        return {
          type,
          path: boundary.url,
          changedPath: url,
          timestamp: Date.now()
        }
      })
    })
    return
  }

  // fallback to full page reload
  debugHmr(`[full reload] ${prettyUrl}`)
  context.ws.send({
    type: 'full-reload'
  })
}

class ModuleNode {
  url: string
  isBoundary = false
  isDirty = false
  deps = new Set<ModuleNode>()
  importers = new Set<ModuleNode>()
  constructor(url: string) {
    this.url = url
  }
}

// URL -> module map
const moduleGraph = new Map<string, ModuleNode>()

export function updateModuleGraph(
  importerUrl: string,
  deps: Set<string>,
  isBoundary: boolean
) {
  // debug(
  //   `${chalk.green(importerId)} imports ${JSON.stringify([...deps], null, 2)}`
  // )
  const importer = ensureEntry(importerUrl)
  importer.isBoundary = isBoundary
  const prevDeps = importer.deps
  const newDeps = (importer.deps = new Set())
  deps.forEach((url) => {
    const dep = ensureEntry(url)
    dep.importers.add(importer)
    newDeps.add(dep)
  })
  // remove the importer from deps that were imported but no longer are.
  prevDeps.forEach((dep) => {
    if (!newDeps.has(dep)) {
      dep.importers.delete(importer)
    }
  })
}

function ensureEntry(id: string): ModuleNode {
  const entry = moduleGraph.get(id) || new ModuleNode(id)
  moduleGraph.set(id, entry)
  return entry
}

function traceModuleGraph(
  node: ModuleNode,
  boundaries: Set<ModuleNode> = new Set()
) {
  if (node.isBoundary) {
    boundaries.add(node)
    return boundaries
  }
  if (
    node.importers.size &&
    [...node.importers].every((importer) =>
      traceModuleGraph(importer, boundaries)
    )
  ) {
    return boundaries
  }
}
