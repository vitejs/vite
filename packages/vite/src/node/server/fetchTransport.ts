/* eslint-disable n/no-unsupported-features/node-builtins */
import assert from 'node:assert'
import { Readable } from 'node:stream'
import type { HotPayload } from 'types/hmrPayload'
import type { Connect, ViteDevServer } from '..'
import type { HotChannel, HotChannelListener } from './hmr'

export function fetchTransportMiddleware(
  server: ViteDevServer,
): Connect.NextHandleFunction {
  return async function viteFetchTransportMiddleware(req, res, next) {
    // TODO: protect endpoint
    if (req.url !== '/@vite/transport') {
      return next()
    }
    const environmentName = req.headers['x-vite-environment']
    if (typeof environmentName !== 'string') {
      res.statusCode = 400
      res.end(JSON.stringify({ message: 'missing environment' }))
      return
    }
    const environment = server.environments[environmentName]
    if (!environment) {
      res.statusCode = 400
      res.end(
        JSON.stringify({ message: `unknown environment '${environmentName}'` }),
      )
      return
    }
    const api = environment.hot.api
    if (!(api instanceof ServerFetchTransport)) {
      res.statusCode = 400
      res.end(
        JSON.stringify({ message: `invalid environment '${environmentName}'` }),
      )
      return
    }
    try {
      await api.handler(req, res)
    } catch (e) {
      next(e)
    }
  }
}

export function createServerFetchTransport(): HotChannel {
  return new ServerFetchTransport()
}

interface SSEClientProxy {
  send(payload: HotPayload): void
  close(): void
}

class ServerFetchTransport implements HotChannel {
  private clientMap = new Map<string, SSEClientProxy>()
  private listenerManager = createListenerManager()

  on = this.listenerManager.on
  off = this.listenerManager.off
  send: HotChannel['send'] = (payload) => {
    for (const client of this.clientMap.values()) {
      client.send(payload)
    }
  }
  close() {
    for (const client of this.clientMap.values()) {
      client.close()
    }
  }

  // expose hot.api.handler
  api = this

  handler: Connect.SimpleHandleFunction = async (req, res) => {
    // handle 'send'
    if (req.method === 'POST') {
      const senderId = req.headers['x-client-id']
      assert(typeof senderId === 'string')
      const client = this.clientMap.get(senderId)
      assert(client)
      const payload = JSON.parse(await readReq(req))
      this.listenerManager.dispatch(payload, client)
      res.end(JSON.stringify({ ok: true }))
      return
    }
    // handle 'connect'
    assert(req.method === 'GET')
    let controller: ReadableStreamDefaultController<string>
    const stream = new ReadableStream<string>({
      start: (controller_) => {
        controller = controller_
        controller.enqueue(`:ping\n\n`)
      },
      cancel: () => {
        this.clientMap.delete(clientId)
      },
    })
    const pingInterval = setInterval(() => {
      controller.enqueue(`:ping\n\n`)
    }, 10_000)
    const clientId = Math.random().toString(36).slice(2)
    const client: SSEClientProxy = {
      send(payload) {
        controller.enqueue(`data: ${JSON.stringify(payload)}\n\n`)
      },
      close() {
        clearInterval(pingInterval)
        controller.close()
      },
    }
    this.clientMap.set(clientId, client)
    res.setHeader('x-client-id', clientId)
    res.setHeader('content-type', 'text/event-stream')
    res.setHeader('cache-control', 'no-cache')
    res.setHeader('connection', 'keep-alive')
    Readable.fromWeb(stream as any).pipe(res)
  }
}

function readReq(req: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    let payload = ''
    req.on('data', (chunk) => {
      payload += chunk.toString()
    })
    req.on('end', () => {
      resolve(payload)
    })
    req.on('error', (error) => {
      reject(error)
    })
  })
}

// wrapper to simplify listener management
function createListenerManager(): Pick<HotChannel, 'on' | 'off'> & {
  dispatch: (
    payload: HotPayload,
    client: { send: (payload: HotPayload) => void },
  ) => void
} {
  const listerMap: Record<string, Set<HotChannelListener>> = {}
  const getListerMap = (e: string) => (listerMap[e] ??= new Set())

  return {
    on(event: string, listener: HotChannelListener) {
      if (event === 'connection') {
        return
      }
      getListerMap(event).add(listener)
    },
    off(event, listener: any) {
      if (event === 'connection') {
        return
      }
      getListerMap(event).delete(listener)
    },
    dispatch(payload, client) {
      if (payload.type === 'custom') {
        for (const lister of getListerMap(payload.event)) {
          lister(payload.data, client)
        }
      }
    },
  }
}
