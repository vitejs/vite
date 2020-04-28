// How HMR works
// 1. `.vue` files are transformed into `.js` files before being served
// 2. All `.js` files, before being served, are parsed to detect their imports
//    (this is done in `./modules.ts`) for module import rewriting. During this
//    we also record the importer/importee relationships which can be used for
//    HMR analysis (we do both at the same time to avoid double parse costs)
// 3. When a `.vue` file changes, we directly read, parse it again and
//    notify the client because Vue components are self-accepting by nature
// 4. When a js file changes, it triggers an HMR graph analysis, where we try to
//    walk its importer chains and see if we reach a "HMR boundary". An HMR
//    boundary is either a `.vue` file or a `.js` file that explicitly indicated
//    that it accepts hot updates (by importing from the `/@hmr` special module)
// 5. If any parent chain exhausts without ever running into an HMR boundary,
//    it's considered a "dead end". This causes a full page reload.
// 6. If a `.vue` boundary is encountered, we add it to the `vueImports` Set.
// 7. If a `.js` boundary is encountered, we check if the boundary's current
//    child importer is in the accepted list of the boundary (see additional
//    explanation below). If yes, record current child importer in the
//    `jsImporters` Set.
// 8. If the graph walk finished without running into dead ends, notify the
//    client to update all `jsImporters` and `vueImporters`.

// How do we get a js HMR boundary's accepted list on the server
// 1. During the import rewriting, if `/@hmr` import is present in a js file,
//    we will do a fullblown parse of the file to find the `hot.accept` call,
//    and records the file and its accepted dependencies in a `hmrBoundariesMap`
// 2. We also inject the boundary file's full path into the `hot.accept` call
//    so that on the client, the `hot.accept` call would have registered for
//    updates using the full paths of the dependencies.

import { Plugin } from './server'
import path from 'path'
import WebSocket from 'ws'
import hash_sum from 'hash-sum'
import { SFCBlock } from '@vue/compiler-sfc'
import { parseSFC, vueCache } from './serverPluginVue'
import { cachedRead } from './utils'
import { importerMap, hmrBoundariesMap } from './serverPluginModules'
import chalk from 'chalk'

export const debugHmr = require('debug')('vite:hmr')

// client and node files are placed flat in the dist folder
export const hmrClientFilePath = path.resolve(__dirname, './client.js')
export const hmrClientPublicPath = '/@hmr'

interface HMRPayload {
  type: string
  timestamp: number
  path?: string
  id?: string
  index?: number
}

export const hmrPlugin: Plugin = ({ root, app, server, watcher, resolver }) => {
  app.use(async (ctx, next) => {
    if (ctx.path !== hmrClientPublicPath) {
      return next()
    }
    debugHmr('serving hmr client')
    ctx.type = 'js'
    await cachedRead(ctx, hmrClientFilePath)
  })

  // start a websocket server to send hmr notifications to the client
  const wss = new WebSocket.Server({ server })
  const sockets = new Set<WebSocket>()

  wss.on('connection', (socket) => {
    debugHmr('ws client connected')
    sockets.add(socket)
    socket.send(JSON.stringify({ type: 'connected' }))
    socket.on('close', () => {
      sockets.delete(socket)
    })
  })

  wss.on('error', (e: Error & { code: string }) => {
    if (e.code !== 'EADDRINUSE') {
      console.error(chalk.red(`[vite] WebSocket server error:`))
      console.error(e)
    }
  })

  const notify = (payload: HMRPayload) => {
    const stringified = JSON.stringify(payload, null, 2)
    debugHmr(`update: ${stringified}`)
    sockets.forEach((s) => s.send(stringified))
  }

  watcher.on('change', async (file) => {
    const timestamp = Date.now()
    if (file.endsWith('.vue')) {
      handleVueReload(file, timestamp)
    } else if (file.endsWith('.js')) {
      handleJSReload(file, timestamp)
    }
  })

  watcher.handleVueReload = handleVueReload
  watcher.handleJSReload = handleJSReload

  async function handleVueReload(
    file: string,
    timestamp: number = Date.now(),
    content?: string
  ) {
    const publicPath = resolver.fileToRequest(file)
    const cacheEntry = vueCache.get(file)

    debugHmr(`busting Vue cache for ${file}`)
    vueCache.del(file)

    const descriptor = await parseSFC(root, file, content)
    if (!descriptor) {
      // read failed
      return
    }

    const prevDescriptor = cacheEntry && cacheEntry.descriptor
    if (!prevDescriptor) {
      // the file has never been accessed yet
      return
    }

    // check which part of the file changed
    let needReload = false
    let needRerender = false

    if (!isEqual(descriptor.script, prevDescriptor.script)) {
      needReload = true
    }

    if (!isEqual(descriptor.template, prevDescriptor.template)) {
      needRerender = true
    }

    const styleId = hash_sum(publicPath)
    const prevStyles = prevDescriptor.styles || []
    const nextStyles = descriptor.styles || []
    if (
      (!needReload &&
        prevStyles.some((s) => s.scoped) !==
          nextStyles.some((s) => s.scoped)) ||
      // TODO for now we force the component to reload on <style module> change
      // but this should be optimizable to replace the __cssMoudles object
      // on script and only trigger a rerender.
      prevStyles.some((s) => s.module != null) ||
      nextStyles.some((s) => s.module != null)
    ) {
      needReload = true
    }

    // only need to update styles if not reloading, since reload forces
    // style updates as well.
    if (!needReload) {
      nextStyles.forEach((_, i) => {
        if (!prevStyles[i] || !isEqual(prevStyles[i], nextStyles[i])) {
          notify({
            type: 'vue-style-update',
            path: publicPath,
            index: i,
            id: `${styleId}-${i}`,
            timestamp
          })
        }
      })
    }

    // stale styles always need to be removed
    prevStyles.slice(nextStyles.length).forEach((_, i) => {
      notify({
        type: 'vue-style-remove',
        path: publicPath,
        id: `${styleId}-${i + nextStyles.length}`,
        timestamp
      })
    })

    if (needReload) {
      notify({
        type: 'vue-reload',
        path: publicPath,
        timestamp
      })
    } else if (needRerender) {
      notify({
        type: 'vue-rerender',
        path: publicPath,
        timestamp
      })
    }
  }

  function handleJSReload(filePath: string, timestamp: number = Date.now()) {
    // normal js file
    const publicPath = resolver.fileToRequest(filePath)
    const importers = importerMap.get(publicPath)
    if (importers) {
      const vueImporters = new Set<string>()
      const jsHotImporters = new Set<string>()
      const hasDeadEnd = walkImportChain(
        publicPath,
        importers,
        vueImporters,
        jsHotImporters
      )

      if (hasDeadEnd) {
        notify({
          type: 'full-reload',
          timestamp
        })
      } else {
        vueImporters.forEach((vueImporter) => {
          notify({
            type: 'vue-reload',
            path: vueImporter,
            timestamp
          })
        })
        jsHotImporters.forEach((jsImporter) => {
          notify({
            type: 'js-update',
            path: jsImporter,
            timestamp
          })
        })
      }
    } else {
      debugHmr(`no importers for ${publicPath}.`)
    }
  }

  function walkImportChain(
    importee: string,
    currentImporters: Set<string>,
    vueImporters: Set<string>,
    jsHotImporters: Set<string>
  ): boolean {
    let hasDeadEnd = false
    for (const importer of currentImporters) {
      if (importer.endsWith('.vue')) {
        vueImporters.add(importer)
      } else if (isHMRBoundary(importer, importee)) {
        jsHotImporters.add(importer)
      } else {
        const parentImpoters = importerMap.get(importer)
        if (!parentImpoters) {
          hasDeadEnd = true
        } else {
          hasDeadEnd = walkImportChain(
            importer,
            parentImpoters,
            vueImporters,
            jsHotImporters
          )
        }
      }
    }
    return hasDeadEnd
  }

  function isHMRBoundary(importer: string, dep: string): boolean {
    const deps = hmrBoundariesMap.get(importer)
    return deps ? deps.has(dep) : false
  }
}

function isEqual(a: SFCBlock | null, b: SFCBlock | null) {
  if (!a && !b) return true
  if (!a || !b) return false
  if (a.content !== b.content) return false
  const keysA = Object.keys(a.attrs)
  const keysB = Object.keys(b.attrs)
  if (keysA.length !== keysB.length) {
    return false
  }
  return keysA.every((key) => a.attrs[key] === b.attrs[key])
}
