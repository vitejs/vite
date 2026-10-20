import type { ServerResponse } from 'node:http'
import type { CustomPayload, HotPayload, Update } from '#types/hmrPayload'
import type { Plugin } from '../plugin'
import type {
  NormalizedHotChannel,
  NormalizedHotChannelClient,
} from '../server/hmr'

interface QueuedChannel {
  payloads: HotPayload[]
  send: (payload: HotPayload) => void
  atomicUpdates: boolean
  reloadOnUpdate: boolean
  lastSequence: number
}

export function agentHmrGate(): Plugin {
  const settleMs = 100
  const endpoint = '/__agent_hmr'
  const channels = new Map<string, QueuedChannel>()
  const clientChannels = new Map<NormalizedHotChannelClient, QueuedChannel>()
  let holding = false
  let payloadSequence = 0
  let settleTimer: ReturnType<typeof setTimeout> | undefined
  let pendingFlush:
    | {
        promise: Promise<void>
        resolve: () => void
      }
    | undefined

  function begin() {
    if (holding) return

    holding = true
    payloadSequence = 0
    for (const channel of [...channels.values(), ...clientChannels.values()]) {
      channel.payloads = []
      channel.lastSequence = 0
    }
  }

  function mergeUpdates(payloads: HotPayload[]): Update[] {
    const updates = new Map<string, Update>()
    for (const payload of payloads) {
      if (payload.type !== 'update') continue
      for (const update of payload.updates) {
        const key = `${update.type}:${update.path}:${update.acceptedPath}`
        updates.set(key, update)
      }
    }
    return [...updates.values()]
  }

  function commit() {
    holding = false
    const activeChannels = [...channels.values(), ...clientChannels.values()]

    const finalChannel = activeChannels
      .filter((channel) => channel.payloads.length > 0)
      .sort((a, b) => b.lastSequence - a.lastSequence)[0]
    const finalPayload = finalChannel?.payloads.at(-1)
    if (finalPayload?.type === 'error') {
      if (
        activeChannels.some((channel) =>
          channel.payloads.some((payload) => payload.type !== 'error'),
        )
      ) {
        for (const channel of activeChannels) channel.reloadOnUpdate = true
      }
      for (const channel of activeChannels) {
        const error = channel.payloads.at(-1)
        channel.payloads = []
        if (error?.type === 'error') channel.send(error)
      }
      return
    }

    if (activeChannels.some((channel) => channel.reloadOnUpdate)) {
      for (const channel of activeChannels) {
        channel.payloads = []
        channel.reloadOnUpdate = false
      }
      finalChannel?.send({ type: 'full-reload', path: '*' })
      return
    }

    for (const channel of activeChannels) {
      const payloads = channel.payloads
      channel.payloads = []
      if (payloads.length === 0) continue

      if (payloads.some((payload) => payload.type === 'prune')) {
        channel.send({ type: 'full-reload', path: '*' })
        continue
      }

      const fullReloads = payloads.filter(
        (payload) => payload.type === 'full-reload',
      )
      if (fullReloads.length > 0) {
        for (const payload of fullReloads) channel.send(payload)
        continue
      }

      const updates = mergeUpdates(payloads)
      if (updates.length > 0) {
        channel.send({
          type: channel.atomicUpdates ? 'update-batch' : 'update',
          updates,
        })
      }

      const bundledUpdates = payloads.flatMap((payload) => {
        if (payload.type === 'bundled-dev-update') return [payload]
        return []
      })
      if (bundledUpdates.length > 0) {
        channel.send({
          type: 'bundled-dev-update-batch',
          updates: bundledUpdates,
        })
      }
    }
  }

  function scheduleCommit() {
    if (!pendingFlush) return
    clearTimeout(settleTimer)
    settleTimer = setTimeout(() => {
      const flush = pendingFlush
      pendingFlush = undefined
      settleTimer = undefined
      commit()
      flush?.resolve()
    }, settleMs)
  }

  function flush(): Promise<void> {
    if (!holding) return Promise.resolve()
    if (pendingFlush) return pendingFlush.promise

    let resolve!: () => void
    const promise = new Promise<void>((done) => {
      resolve = done
    })
    pendingFlush = { promise, resolve }
    scheduleCommit()
    return promise
  }

  function sendJson(res: ServerResponse, body: unknown) {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(body))
  }

  return {
    name: 'agent-hmr-gate',
    apply: 'serve',
    enforce: 'post',

    configureServer(server) {
      function queuePayload(channel: QueuedChannel, payload: HotPayload) {
        const allChannels = [...channels.values(), ...clientChannels.values()]
        if (!holding && allChannels.some((item) => item.reloadOnUpdate)) {
          if (payload.type === 'full-reload') {
            for (const item of allChannels) item.reloadOnUpdate = false
          } else if (
            payload.type === 'update' ||
            payload.type === 'bundled-dev-update' ||
            payload.type === 'prune'
          ) {
            for (const item of allChannels) item.reloadOnUpdate = false
            channel.send({ type: 'full-reload', path: '*' })
            return true
          }
        }
        if (
          holding &&
          (payload.type === 'update' ||
            payload.type === 'bundled-dev-update' ||
            payload.type === 'full-reload' ||
            payload.type === 'prune' ||
            payload.type === 'error')
        ) {
          channel.payloads.push(payload)
          channel.lastSequence = ++payloadSequence
          scheduleCommit()
          return true
        }
        return false
      }

      for (const [name, environment] of Object.entries(server.environments)) {
        const send = environment.hot.send.bind(environment.hot)
        const sendPayload = (payload: HotPayload) => send(payload)
        const channel: QueuedChannel = {
          payloads: [],
          send: sendPayload,
          atomicUpdates: name === 'client',
          reloadOnUpdate: false,
          lastSequence: 0,
        }
        channels.set(name, channel)
        environment.hot.send = ((
          payload: HotPayload | string,
          data?: CustomPayload['data'],
        ) => {
          if (typeof payload === 'string') {
            send(payload, data)
            return
          }
          if (queuePayload(channel, payload)) return
          sendPayload(payload)
        }) as NormalizedHotChannel['send']
      }

      if (server.config.experimental.bundledDev) {
        const clientEnvironment = server.environments.client
        clientEnvironment.hot.on('vite:client:connect', (_data, client) => {
          const send = client.send.bind(client)
          const sendPayload = (payload: HotPayload) => send(payload)
          const channel: QueuedChannel = {
            payloads: [],
            send: sendPayload,
            atomicUpdates: true,
            reloadOnUpdate: false,
            lastSequence: 0,
          }
          clientChannels.set(client, channel)
          client.send = ((
            payload: HotPayload | string,
            data?: CustomPayload['data'],
          ) => {
            if (typeof payload === 'string') {
              send(payload, data)
              return
            }
            if (queuePayload(channel, payload)) return
            sendPayload(payload)
          }) as NormalizedHotChannelClient['send']
        })
        clientEnvironment.hot.on('vite:client:disconnect', (_data, client) => {
          clientChannels.delete(client)
        })
      }

      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split('?', 1)[0]
        if (req.method === 'POST' && pathname === `${endpoint}/begin`) {
          begin()
          sendJson(res, {})
          return
        }
        if (req.method === 'POST' && pathname === `${endpoint}/flush`) {
          void flush().then(() => sendJson(res, {}))
          return
        }
        next()
      })
    },
  }
}
