import fs from 'node:fs'
import path from 'node:path'
import { Worker } from 'node:worker_threads'
import { afterAll, expect, onTestFinished, test } from 'vitest'
import { NativeModuleRunner } from 'vite/module-runner'
import type { ModuleRunner } from 'vite/module-runner'
import type { HotPayload } from '#types/hmrPayload'
import { createServer } from '../..'
import { createServerModuleRunnerTransport } from '../../ssr/runtime/serverModuleRunner'
import type {
  HotChannel,
  HotChannelClient,
  HotChannelListener,
  NormalizedServerHotChannel,
} from '../hmr'
import { DevEnvironment } from '../environment'
import { createRunnableDevEnvironment } from '../environments/runnableEnvironment'
import type { RunnableDevEnvironment } from '../environments/runnableEnvironment'

const root = path.resolve(import.meta.dirname, 'fixtures/bundled-dev-ssr')

// every server needs its own url space: the process-wide ESM cache never
// re-executes an url a previous server's runner already imported
let serverCount = 0

/** reads a fixture file and restores its content when the test finishes */
function backupFile(file: string): string {
  const original = fs.readFileSync(file, 'utf-8')
  onTestFinished(() => {
    fs.writeFileSync(file, original)
  })
  return original
}

async function createBundledSsrServer() {
  const server = await createServer({
    root,
    configFile: false,
    cacheDir: `node_modules/.vite-test/${serverCount++}`,
    logLevel: 'error',
    server: {
      middlewareMode: true,
      // NOTE: `watch: null` would also disable the dev engine's own watcher
      // (`convertToDevWatchOptions`), which the HMR tests depend on
      ws: false,
    },
    optimizeDeps: {
      noDiscovery: true,
      include: [],
    },
    environments: {
      ssr: {
        isBundled: true,
        nativeModuleRunner: true,
        dev: {
          createEnvironment: (name, config) =>
            createRunnableDevEnvironment(name, config, {
              runner: (environment) =>
                new NativeModuleRunner({
                  transport: createServerModuleRunnerTransport({
                    channel: environment.hot as NormalizedServerHotChannel,
                  }),
                }) as unknown as ModuleRunner,
            }),
        },
        build: {
          rolldownOptions: {
            input: [
              path.resolve(root, 'src/app.js'),
              path.resolve(root, 'src/hot-entry.js'),
            ],
          },
        },
      },
    },
  })
  onTestFinished(() => server.close())
  return server
}

/**
 * The intended consumer story for `full-reload` with a real runtime boundary:
 * the runner lives in a worker thread, the consumer provides the server-side
 * channel, observes `full-reload` there instead of forwarding it to the
 * runner, and recreates the worker against the same (still running) server.
 */
async function createWorkerBundledSsrServer() {
  const listeners = new Map<string, Set<HotChannelListener>>()
  const receivedFullReloads: HotPayload[] = []
  const pendingImports = new Map<
    number,
    { resolve: (value: string) => void; reject: (error: Error) => void }
  >()
  let nextImportId = 0
  let worker!: Worker
  let workerClient!: HotChannelClient

  // the consumer's reload policy: a full reload never reaches the runner —
  // the consumer restarts the runtime instead (`restartWorker` below)
  const sendToWorker = (payload: HotPayload) => {
    if (payload.type === 'full-reload') {
      receivedFullReloads.push(payload)
      return
    }
    worker.postMessage(payload)
  }

  const dispatch = (event: string, data: any) => {
    for (const listener of listeners.get(event) ?? []) {
      listener(data, workerClient)
    }
  }

  const spawnWorker = async () => {
    workerClient = { send: sendToWorker }
    worker = new Worker(path.join(root, 'runner-worker.mjs'))
    worker.on('message', (message: any) => {
      if (message?.__test === 'import-result') {
        const pending = pendingImports.get(message.id)
        pendingImports.delete(message.id)
        if (message.error != null) pending?.reject(new Error(message.error))
        else pending?.resolve(message.value)
      } else if (message?.type === 'custom') {
        dispatch(message.event, message.data)
      }
    })
    await new Promise<void>((resolve) => worker.once('online', () => resolve()))
    dispatch('vite:client:connect', null)
  }

  const stopWorker = async () => {
    dispatch('vite:client:disconnect', null)
    await worker.terminate()
  }

  const channel: HotChannel = {
    send: sendToWorker,
    on(event: string, listener: HotChannelListener) {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event)!.add(listener)
    },
    off(event, listener) {
      listeners.get(event)?.delete(listener as HotChannelListener)
    },
    listen: () => {},
    async close() {
      await stopWorker()
    },
  }

  const server = await createServer({
    root,
    configFile: false,
    cacheDir: `node_modules/.vite-test/${serverCount++}`,
    logLevel: 'error',
    server: {
      middlewareMode: true,
      ws: false,
    },
    optimizeDeps: {
      noDiscovery: true,
      include: [],
    },
    environments: {
      ssr: {
        isBundled: true,
        nativeModuleRunner: true,
        dev: {
          createEnvironment: (name, config) =>
            new DevEnvironment(name, config, { hot: true, transport: channel }),
        },
        build: {
          rolldownOptions: {
            input: [path.resolve(root, 'src/app.js')],
          },
        },
      },
    },
  })
  // closing the server also closes the channel, which terminates the worker
  onTestFinished(() => server.close())
  await spawnWorker()

  const importInWorker = (url: string) => {
    const id = nextImportId++
    return new Promise<string>((resolve, reject) => {
      pendingImports.set(id, { resolve, reject })
      worker.postMessage({ __test: 'import', id, url })
    })
  }

  return {
    server,
    importInWorker,
    restartWorker: async () => {
      await stopWorker()
      await spawnWorker()
    },
    receivedFullReloads,
  }
}

afterAll(() => {
  fs.rmSync(path.join(root, 'node_modules'), { recursive: true, force: true })
})

test('imports a bundled ssr entry natively', async () => {
  const server = await createBundledSsrServer()
  const ssr = server.environments.ssr as RunnableDevEnvironment
  const mod = await ssr.runner.import('/src/app.js')
  expect(await mod.render()).toBe('hello-dep|hello-lazy')

  // an absolute file path resolves to the same entry (the second import
  // returns the runtime's live exports object, so compare members)
  const mod2 = await ssr.runner.import(path.resolve(root, 'src/app.js'))
  expect(mod2.render).toBe(mod.render)
})

test('applies an hmr patch in place for a self-accepting module', async () => {
  const hotFile = path.resolve(root, 'src/hot.js')
  const originalContent = backupFile(hotFile)
  const server = await createBundledSsrServer()
  const ssr = server.environments.ssr as RunnableDevEnvironment
  const mod = await ssr.runner.import('/src/app.js')
  expect((globalThis as any).__bundled_dev_ssr_hot).toBe('hot-v1')

  fs.writeFileSync(hotFile, originalContent.replace('hot-v1', 'hot-v2'))
  // the self-accepting module is re-executed by the patch, in place
  await expect
    .poll(() => (globalThis as any).__bundled_dev_ssr_hot, {
      timeout: 10_000,
      interval: 50,
    })
    .toBe('hot-v2')

  // no full reload happened: the entry still renders from the same graph
  const mod2 = await ssr.runner.import('/src/app.js')
  expect(await mod2.render()).toBe('hello-dep|hello-lazy')

  // a second patch continues the same session (seq continuity)
  fs.writeFileSync(hotFile, originalContent.replace('hot-v1', 'hot-v3'))
  await expect
    .poll(() => (globalThis as any).__bundled_dev_ssr_hot, {
      timeout: 10_000,
      interval: 50,
    })
    .toBe('hot-v3')
  expect(await mod.render()).toBe('hello-dep|hello-lazy')
})

test('import() returns the updated module after an hmr patch', async () => {
  const entryFile = path.resolve(root, 'src/hot-entry.js')
  const originalContent = backupFile(entryFile)
  const server = await createBundledSsrServer()
  const ssr = server.environments.ssr as RunnableDevEnvironment
  const mod = await ssr.runner.import('/src/hot-entry.js')
  expect(mod.value).toBe('entry-v1')

  fs.writeFileSync(entryFile, originalContent.replace('entry-v1', 'entry-v2'))
  // the self-accepting entry is patched in place; import() hands out the
  // runtime's live module, not the pre-patch ESM namespace
  await expect
    .poll(
      async () => {
        const mod = await ssr.runner.import('/src/hot-entry.js')
        return mod.value
      },
      { timeout: 10_000, interval: 50 },
    )
    .toBe('entry-v2')

  // the originally imported namespace stays what it was — the update is a
  // different module object owned by the hmr client
  expect(mod.value).toBe('entry-v1')
})

// TODO: document how to resolve this

// KNOWN GAP: while an HMR session is active, an edit to a never-executed
// module is lost: the runner noops the patch (nothing executed to update)
// and `refreshOutputIfStale` skips the rebuild (active session), so the
// first import runs the stale on-disk chunk. The next edit of the file
// heals it. A real fix needs per-entry freshness tracking — a blind
// rebuild would re-execute the already-patched graph under new hashes.
test.fails('an edit to a not-yet-imported entry is visible on its first import', async () => {
  const entryFile = path.resolve(root, 'src/hot-entry.js')
  const hotFile = path.resolve(root, 'src/hot.js')
  const originalEntry = backupFile(entryFile)
  const originalHot = backupFile(hotFile)
  const server = await createBundledSsrServer()
  const ssr = server.environments.ssr as RunnableDevEnvironment
  // executes app.js's graph (including hot.js) but NOT hot-entry.js
  await ssr.runner.import('/src/app.js')

  // edit the entry that was never imported: the runner receives a patch,
  // but noops it because nothing of hot-entry's graph is executed
  fs.writeFileSync(entryFile, originalEntry.replace('entry-v1', 'entry-v2'))
  // then edit an executed module as a barrier: patches are delivered and
  // applied in order, so once this one is observable the hot-entry patch
  // has been processed too
  fs.writeFileSync(hotFile, originalHot.replace('hot-v1', 'hot-v2'))
  await expect
    .poll(() => (globalThis as any).__bundled_dev_ssr_hot, {
      timeout: 10_000,
      interval: 50,
    })
    .toBe('hot-v2')

  const mod = await ssr.runner.import('/src/hot-entry.js')
  expect(mod.value).toBe('entry-v2')
})

test('throws after a change that requires a full reload', async () => {
  const depFile = path.resolve(root, 'src/dep.js')
  const originalContent = backupFile(depFile)
  const server = await createBundledSsrServer()
  const ssr = server.environments.ssr as RunnableDevEnvironment
  const mod = await ssr.runner.import('/src/app.js')
  expect(await mod.render()).toBe('hello-dep|hello-lazy')

  // an unaccepted change cannot be patched in place — the server requests
  // a full reload, which is fatal for the native runner
  fs.writeFileSync(depFile, originalContent.replace('hello-dep', 'updated-dep'))
  await expect
    .poll(
      () =>
        ssr.runner.import('/src/app.js').then(
          () => 'ok',
          (e) => (/full reload/.test(e.message) ? 'fatal' : `other: ${e}`),
        ),
      { timeout: 10_000, interval: 100 },
    )
    .toBe('fatal')
})

test('concurrent imports during a file change all settle', async () => {
  const depFile = path.resolve(root, 'src/dep.js')
  const originalContent = backupFile(depFile)
  const server = await createBundledSsrServer()
  const ssr = server.environments.ssr as RunnableDevEnvironment
  await ssr.runner.import('/src/app.js')

  fs.writeFileSync(depFile, originalContent.replace('hello-dep', 'settled-dep'))
  // refreshes are serialized — none of these may hang. Each either
  // observes a bundle version, or the fatal full-reload error once the
  // unaccepted change escalated
  const results = await Promise.allSettled(
    Array.from({ length: 5 }, async () => {
      const mod = await ssr.runner.import('/src/app.js')
      return mod.render()
    }),
  )
  for (const result of results) {
    if (result.status === 'fulfilled') {
      expect(['hello-dep|hello-lazy', 'settled-dep|hello-lazy']).toContain(
        await result.value,
      )
    } else {
      expect(result.reason.message).toMatch(/full reload/)
    }
  }
  await expect
    .poll(
      () =>
        ssr.runner.import('/src/app.js').then(
          () => 'ok',
          (e) => (/full reload/.test(e.message) ? 'fatal' : `other: ${e}`),
        ),
      { timeout: 10_000, interval: 100 },
    )
    .toBe('fatal')
})

test('surfaces build errors on import', async () => {
  const depFile = path.resolve(root, 'src/dep.js')
  const originalContent = backupFile(depFile)
  let server = await createBundledSsrServer()
  let ssr = server.environments.ssr as RunnableDevEnvironment
  await ssr.runner.import('/src/app.js')

  fs.writeFileSync(depFile, 'export const msg = {{{')
  await expect
    .poll(
      () =>
        ssr.runner.import('/src/app.js').then(
          () => 'resolved',
          () => 'rejected',
        ),
      { timeout: 10_000, interval: 100 },
    )
    .toBe('rejected')

  // fixing the unaccepted module escalates to a full reload — recovery is
  // a restart, like any other full reload
  fs.writeFileSync(depFile, originalContent)
  await server.close()
  server = await createBundledSsrServer()
  ssr = server.environments.ssr as RunnableDevEnvironment
  const mod = await ssr.runner.import('/src/app.js')
  expect(await mod.render()).toBe('hello-dep|hello-lazy')
})

test(
  'a consumer channel intercepts full-reload and restarts the runtime',
  { timeout: 20_000 },
  async () => {
    const depFile = path.resolve(root, 'src/dep.js')
    const originalContent = backupFile(depFile)
    const { importInWorker, restartWorker, receivedFullReloads } =
      await createWorkerBundledSsrServer()
    expect(await importInWorker('/src/app.js')).toBe('hello-dep|hello-lazy')

    // the unaccepted change escalates to a per-client full reload, which
    // the consumer-provided channel observes instead of forwarding
    fs.writeFileSync(
      depFile,
      originalContent.replace('hello-dep', 'updated-dep'),
    )
    await expect
      .poll(() => receivedFullReloads.length, {
        timeout: 10_000,
        interval: 50,
      })
      .toBeGreaterThan(0)

    // the consumer recreates the runtime against the same server: a fresh
    // worker means a fresh esm cache and a fresh rolldown runtime. The
    // first import resolves against rebuilt output (the full reload marked
    // the patched session's output as no longer usable)
    await restartWorker()
    expect(await importInWorker('/src/app.js')).toBe('updated-dep|hello-lazy')
  },
)
