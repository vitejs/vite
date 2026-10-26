import path from 'node:path'
import { expect, onTestFinished, test } from 'vitest'
import WebSocket from 'ws'
import { handleHMRUpdate, normalizeHotChannel } from '../hmr'
import { type ServerOptions, createServer } from '../index'

async function testRestartDuringHotUpdate(serverOptions: ServerOptions = {}) {
  let hookCalls = 0
  const server = await createServer({
    configFile: false,
    root: import.meta.dirname,
    logLevel: 'silent',
    server: {
      middlewareMode: true,
      ws: false,
      ...serverOptions,
    },
    plugins: [
      {
        name: 'restart-during-hot-update',
        async hotUpdate() {
          if (hookCalls++ === 0) {
            await server.restart()
            throw new Error('hot update interrupted by restart')
          }
        },
      },
    ],
  })
  onTestFinished(async () => {
    await server.close()
  })

  await expect(
    handleHMRUpdate(
      'update',
      path.join(import.meta.dirname, 'fixture.js'),
      server,
    ),
  ).resolves.toBeUndefined()
}

test('cancels HMR when the server restarts during a hot update', async () => {
  await testRestartDuringHotUpdate()
})

test('does not schedule stale HMR with a custom environment handler', async () => {
  let hotUpdateEnvironmentsCalls = 0
  await testRestartDuringHotUpdate({
    async hotUpdateEnvironments(server, hmr) {
      hotUpdateEnvironmentsCalls++
      await Promise.all(Object.values(server.environments).map(hmr))
    },
  })
  expect(hotUpdateEnvironmentsCalls).toBe(0)
})

test('normalizeHotChannel suppresses update and full-reload on client.send when enableHmr is false', () => {
  const sentPayloads: any[] = []
  const mockRawClient = {
    send: (payload: any) => {
      sentPayloads.push(payload)
    },
  }

  let capturedClient: any
  const rawChannel = {
    on: (event: string, cb: any) => {
      if (event === 'test-event') {
        cb('data', mockRawClient)
      }
    },
  }

  const channel = normalizeHotChannel(rawChannel as any, false, true)
  channel.on('test-event', (_data, client) => {
    capturedClient = client
  })

  expect(capturedClient).toBeDefined()

  // Should be suppressed
  capturedClient.send({ type: 'update', updates: [] })
  capturedClient.send({
    type: 'bundled-dev-update',
    changedIds: ['foo.js'],
    url: 'patch.js',
    seq: 1,
  })
  capturedClient.send({ type: 'full-reload', path: '*' })

  expect(sentPayloads).toHaveLength(0)

  // Should be allowed
  capturedClient.send({ type: 'custom', event: 'foo', data: { bar: 1 } })
  capturedClient.send({ type: 'error', err: { message: 'err', stack: '' } })
  capturedClient.send({ type: 'connected' })
  capturedClient.send({ type: 'ping' })

  expect(sentPayloads).toHaveLength(4)
  expect(sentPayloads.map((p) => p.type)).toEqual([
    'custom',
    'error',
    'connected',
    'ping',
  ])
})

test('server with hmr: false suppresses client.send update payloads', async () => {
  const server = await createServer({
    configFile: false,
    root: import.meta.dirname,
    logLevel: 'silent',
    server: {
      port: 0,
      hmr: false,
    },
  })
  await server.listen()
  onTestFinished(async () => {
    await server.close()
  })

  const httpServer = server.httpServer
  const address = httpServer?.address()
  const port = typeof address === 'object' && address ? address.port : 5173
  const token = server.config.webSocketToken
  const ws = new WebSocket(`ws://localhost:${port}/?token=${token}`, 'vite-hmr')
  onTestFinished(() => {
    ws.close()
  })

  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve()
    ws.onerror = (e) => reject(e)
  })

  const messages: any[] = []
  ws.onmessage = (event) => {
    messages.push(JSON.parse(String(event.data)))
  }

  let capturedClient: any
  server.hot.on('custom-client-event', (_data, client) => {
    capturedClient = client
  })

  ws.send(
    JSON.stringify({
      type: 'custom',
      event: 'custom-client-event',
      data: {},
    }),
  )

  await expect.poll(() => capturedClient).toBeDefined()

  // Suppressed
  capturedClient.send({ type: 'update', updates: [] })
  capturedClient.send({
    type: 'bundled-dev-update',
    changedIds: ['foo.js'],
    url: 'patch.js',
    seq: 1,
  })
  capturedClient.send({ type: 'full-reload', path: '*' })

  // Allowed
  capturedClient.send({ type: 'custom', event: 'foo', data: {} })

  await expect
    .poll(() => messages.find((m) => m.type === 'custom' && m.event === 'foo'))
    .toBeDefined()

  expect(
    messages.filter(
      (m) =>
        m.type === 'update' ||
        m.type === 'bundled-dev-update' ||
        m.type === 'full-reload',
    ),
  ).toHaveLength(0)
})
