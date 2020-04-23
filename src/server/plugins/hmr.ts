import { Plugin } from '../index'
import path from 'path'
import WebSocket from 'ws'
import hash_sum from 'hash-sum'
import chokidar from 'chokidar'
import { SFCBlock } from '@vue/compiler-sfc'
import { parseSFC, vueCache } from './vue'
import { cachedRead } from '../utils'
import { importerMap } from './modules'

const hmrClientFilePath = path.resolve(__dirname, '../../client/client.js')
export const hmrClientPublicPath = '/@hmr'

interface HMRPayload {
  type: string
  path?: string
  id?: string
  index?: number
}

export const hmrPlugin: Plugin = ({ root, app, server }) => {
  app.use(async (ctx, next) => {
    if (ctx.path !== hmrClientPublicPath) {
      return next()
    }
    ctx.type = 'js'
    ctx.body = await cachedRead(hmrClientFilePath)
  })

  // start a websocket server to send hmr notifications to the client
  const wss = new WebSocket.Server({ server })
  const sockets = new Set<WebSocket>()

  wss.on('connection', (socket) => {
    sockets.add(socket)
    socket.send(JSON.stringify({ type: 'connected' }))
    socket.on('close', () => {
      sockets.delete(socket)
    })
  })

  wss.on('error', (e: Error & { code: string }) => {
    if (e.code !== 'EADDRINUSE') {
      console.error(e)
    }
  })

  const notify = (payload: HMRPayload) => {
    const stringified = JSON.stringify(payload)
    console.log(`[hmr] ${stringified}`)
    sockets.forEach((s) => s.send(stringified))
  }

  const watcher = chokidar.watch(root, {
    ignored: [/node_modules/]
  })

  watcher.on('change', async (file) => {
    const servedPath = '/' + path.relative(root, file)
    if (file.endsWith('.vue')) {
      handleVueSFCReload(file, servedPath)
    } else {
      handleJSReload(servedPath)
    }
  })

  function handleJSReload(servedPath: string) {
    // normal js file
    const importers = importerMap.get(servedPath)
    if (importers) {
      const vueImporters = new Set<string>()
      const jsHotImporters = new Set<string>()
      const hasDeadEnd = walkImportChain(
        importers,
        vueImporters,
        jsHotImporters
      )

      if (hasDeadEnd) {
        notify({
          type: 'full-reload'
        })
      } else {
        vueImporters.forEach((vueImporter) => {
          notify({
            type: 'reload',
            path: vueImporter
          })
        })
        jsHotImporters.forEach((jsImporter) => {
          // TODO
          console.log(jsImporter)
        })
      }
    }
  }

  function walkImportChain(
    currentImporters: Set<string>,
    vueImporters: Set<string>,
    jsHotImporters: Set<string>
  ): boolean {
    let hasDeadEnd = false
    for (const importer of currentImporters) {
      if (importer.endsWith('.vue')) {
        vueImporters.add(importer)
      } else if (isHotBoundary(importer)) {
        jsHotImporters.add(importer)
      } else {
        const parentImpoters = importerMap.get(importer)
        if (!parentImpoters) {
          hasDeadEnd = true
        } else {
          hasDeadEnd = walkImportChain(
            parentImpoters,
            vueImporters,
            jsHotImporters
          )
        }
      }
    }
    return hasDeadEnd
  }

  function isHotBoundary(servedPath: string): boolean {
    // TODO
    return true
  }

  async function handleVueSFCReload(file: string, servedPath: string) {
    const cacheEntry = vueCache.get(file)
    vueCache.del(file)

    const descriptor = await parseSFC(root, file)
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
    if (!isEqual(descriptor.script, prevDescriptor.script)) {
      notify({
        type: 'reload',
        path: servedPath
      })
      return
    }

    if (!isEqual(descriptor.template, prevDescriptor.template)) {
      notify({
        type: 'rerender',
        path: servedPath
      })
      return
    }

    const prevStyles = prevDescriptor.styles || []
    const nextStyles = descriptor.styles || []
    if (prevStyles.some((s) => s.scoped) !== nextStyles.some((s) => s.scoped)) {
      notify({
        type: 'reload',
        path: servedPath
      })
    }
    const styleId = hash_sum(servedPath)
    nextStyles.forEach((_, i) => {
      if (!prevStyles[i] || !isEqual(prevStyles[i], nextStyles[i])) {
        notify({
          type: 'style-update',
          path: servedPath,
          index: i,
          id: `${styleId}-${i}`
        })
      }
    })
    prevStyles.slice(nextStyles.length).forEach((_, i) => {
      notify({
        type: 'style-remove',
        path: servedPath,
        id: `${styleId}-${i + nextStyles.length}`
      })
    })
  }
}

function isEqual(a: SFCBlock | null, b: SFCBlock | null) {
  if (!a || !b) return false
  if (a.content !== b.content) return false
  const keysA = Object.keys(a.attrs)
  const keysB = Object.keys(b.attrs)
  if (keysA.length !== keysB.length) {
    return false
  }
  return keysA.every((key) => a.attrs[key] === b.attrs[key])
}
