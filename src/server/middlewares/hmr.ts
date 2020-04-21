import { Middleware } from '../index'
import path from 'path'
import WebSocket from 'ws'
import hash_sum from 'hash-sum'
import chokidar from 'chokidar'
import { SFCBlock } from '@vue/compiler-sfc'
import { parseSFC } from './vue'
import { createReadStream } from 'fs'

const hmrClientPath = path.resolve(__dirname, '../../client/client.js')

interface HMRPayload {
  type: string
  path?: string
  id?: string
  index?: number
}

export const hmrMiddleware: Middleware = ({ cwd, app, server }) => {
  app.use((ctx, next) => {
    if (ctx.path !== '/__hmrClient') {
      return next()
    }
    ctx.type = 'js'
    ctx.body = createReadStream(hmrClientPath)
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

  const notify = (payload: HMRPayload) =>
    sockets.forEach((s) => s.send(JSON.stringify(payload)))

  const watcher = chokidar.watch(cwd, {
    ignored: [/node_modules/]
  })

  watcher.on('change', async (file) => {
    const resourcePath = '/' + path.relative(cwd, file)
    const send = (payload: HMRPayload) => {
      console.log(`[hmr] ${JSON.stringify(payload)}`)
      notify(payload)
    }

    if (file.endsWith('.vue')) {
      // check which part of the file changed
      const [descriptor, prevDescriptor] = await parseSFC(cwd, file)
      if (!descriptor || !prevDescriptor) {
        // the file has never been accessed yet
        return
      }

      if (!isEqual(descriptor.script, prevDescriptor.script)) {
        send({
          type: 'reload',
          path: resourcePath
        })
        return
      }

      if (!isEqual(descriptor.template, prevDescriptor.template)) {
        send({
          type: 'rerender',
          path: resourcePath
        })
        return
      }

      const prevStyles = prevDescriptor.styles || []
      const nextStyles = descriptor.styles || []
      if (
        prevStyles.some((s) => s.scoped) !== nextStyles.some((s) => s.scoped)
      ) {
        send({
          type: 'reload',
          path: resourcePath
        })
      }
      nextStyles.forEach((_, i) => {
        if (!prevStyles[i] || !isEqual(prevStyles[i], nextStyles[i])) {
          send({
            type: 'style-update',
            path: resourcePath,
            index: i
          })
        }
      })
      prevStyles.slice(nextStyles.length).forEach((_, i) => {
        send({
          type: 'style-remove',
          path: resourcePath,
          id: `${hash_sum(resourcePath)}-${i + nextStyles.length}`
        })
      })
    } else {
      send({
        type: 'full-reload'
      })
    }
  })
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
