import { dev } from 'rolldown/experimental'
import { afterEach, expect, onTestFinished, test, vi } from 'vitest'
import { createServer } from '../index'

vi.mock('rolldown/experimental', async (importOriginal) => ({
  ...(await importOriginal<typeof import('rolldown/experimental')>()),
  dev: vi.fn(),
}))

afterEach(() => vi.restoreAllMocks())

async function setup() {
  const engine = {
    run: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    ensureCurrentBuildFinish: vi.fn(() => new Promise<void>(() => {})),
    ensureLatestBuildOutput: vi.fn().mockResolvedValue(undefined),
    getBundleState: vi.fn().mockResolvedValue({
      hasStaleOutput: false,
      lastBuildErrored: false,
    }),
  }
  vi.mocked(dev).mockResolvedValue(engine as Awaited<ReturnType<typeof dev>>)
  const server = await createServer({
    configFile: false,
    root: import.meta.dirname,
    logLevel: 'silent',
    experimental: { bundledDev: true },
    server: { port: 0, ws: false, watch: null },
  })
  onTestFinished(() => server.close())
  const listeners = vi.spyOn(server.environments.client.hot, 'on')
  await server.listen()
  const bundledDev = server.environments.client.bundledDev!
  const options = vi.mocked(dev).mock.calls.at(-1)![2]!
  const publish = (source = 'build-1') => {
    options.onOutput!({
      output: [
        {
          type: 'asset',
          fileName: 'index.html',
          source,
          names: [],
          originalFileNames: [],
        },
      ],
    } as Parameters<NonNullable<typeof options.onOutput>>[0])
  }
  const client = { send: vi.fn() }
  const connectListener = listeners.mock.calls.find(
    ([event]) => event === 'vite:client:connect',
  )![1]
  const disconnectListener = listeners.mock.calls.find(
    ([event]) => event === 'vite:client:disconnect',
  )![1]
  const connect = () =>
    Reflect.apply(connectListener, undefined, [
      undefined,
      client,
    ]) as Promise<void>
  const disconnect = () =>
    Reflect.apply(disconnectListener, undefined, [undefined, client])
  const startBuild = () => {
    const plugins = vi.mocked(dev).mock.calls.at(-1)![0].plugins
    const plugin = Array.isArray(plugins) ? plugins[0] : undefined
    if (
      !plugin ||
      typeof plugin !== 'object' ||
      !('buildStart' in plugin) ||
      !plugin.buildStart
    ) {
      throw new Error('Missing output publication hook')
    }
    const handler =
      typeof plugin.buildStart === 'function'
        ? plugin.buildStart
        : plugin.buildStart.handler
    Reflect.apply(handler, undefined, [])
  }
  return {
    server,
    bundledDev,
    engine,
    publish,
    client,
    connect,
    disconnect,
    startBuild,
    options,
  }
}

test('waits for Vite to publish current output without requesting generation', async () => {
  const { bundledDev, engine, publish, client, connect } = await setup()
  publish()
  engine.getBundleState.mockResolvedValue({
    hasStaleOutput: true,
    lastBuildErrored: false,
  })
  await connect()
  expect(client.send).not.toHaveBeenCalled()
  expect(engine.ensureLatestBuildOutput).not.toHaveBeenCalled()
  expect(bundledDev.memoryFiles.get('index.html')?.source).toBe('build-1')
  publish('build-2')
  expect(bundledDev.memoryFiles.get('index.html')?.source).toBe('build-2')
  expect(client.send).toHaveBeenCalledExactlyOnceWith({
    type: 'full-reload',
    path: '*',
    ifFallback: true,
  })
})

test('does not confuse engine readiness with Vite-side publication', async () => {
  const { bundledDev, engine, publish, client, connect, startBuild } =
    await setup()
  publish()
  startBuild()
  await engine.ensureLatestBuildOutput()
  await connect()
  expect(client.send).not.toHaveBeenCalled()
  const publishedAtReload: (string | Uint8Array | undefined)[] = []
  client.send.mockImplementation(() => {
    publishedAtReload.push(bundledDev.memoryFiles.get('index.html')?.source)
  })
  publish('build-2')
  expect(publishedAtReload).toEqual(['build-2'])
})

test('notifies a client waiting for the initial publication', async () => {
  const { publish, client, connect } = await setup()
  await connect()
  expect(client.send).not.toHaveBeenCalled()
  publish()
  expect(client.send).toHaveBeenCalledExactlyOnceWith({
    type: 'full-reload',
    path: '*',
    ifFallback: true,
  })
})

test('does not reload on a failed publication and recovers after a successful one', async () => {
  const { server, engine, publish, client, connect, options } = await setup()
  publish()
  engine.getBundleState.mockResolvedValue({
    hasStaleOutput: true,
    lastBuildErrored: false,
  })
  await connect()
  const send = vi.spyOn(server.environments.client.hot, 'send')
  options.onOutput!(new Error('test rebuild failed'))
  expect(send).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }))
  expect(client.send).not.toHaveBeenCalled()
  publish('build-2')
  expect(client.send).toHaveBeenCalledExactlyOnceWith({
    type: 'full-reload',
    path: '*',
    ifFallback: true,
  })
})

test('retains clients that connect during an error until output recovers', async () => {
  const { publish, client, connect, options } = await setup()
  options.onOutput!(new Error('test build failed'))
  await connect()
  expect(client.send).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ type: 'error' }),
  )
  client.send.mockClear()
  publish()
  expect(client.send).toHaveBeenCalledExactlyOnceWith({
    type: 'full-reload',
    path: '*',
    ifFallback: true,
  })
})

test('removes disconnected clients while a state check is pending', async () => {
  const { engine, publish, client, connect, disconnect } = await setup()
  publish()
  let releaseState!: (state: {
    hasStaleOutput: boolean
    lastBuildErrored: boolean
  }) => void
  engine.getBundleState.mockImplementation(
    () =>
      new Promise((resolve) => {
        releaseState = resolve
      }),
  )
  const connecting = connect()
  disconnect()
  publish('build-2')
  releaseState({ hasStaleOutput: false, lastBuildErrored: false })
  await connecting
  expect(client.send).not.toHaveBeenCalled()
})

test('handles shutdown while a state check is pending', async () => {
  const { server, engine, publish, client, connect } = await setup()
  publish()
  let rejectState!: (reason: Error) => void
  engine.getBundleState.mockImplementation(
    () =>
      new Promise((_resolve, reject) => {
        rejectState = reject
      }),
  )
  const connecting = connect()
  await server.close()
  rejectState(new Error('engine closed'))
  await expect(connecting).resolves.toBeUndefined()
  publish('build-2')
  expect(client.send).not.toHaveBeenCalled()
})
