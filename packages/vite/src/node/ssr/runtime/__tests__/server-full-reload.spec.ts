import { randomUUID } from 'node:crypto'
import { mkdtemp, mkdir, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { assert, expect, onTestFinished, test } from 'vitest'
import { EvaluatedModules } from '../../../../module-runner/evaluatedModules'
import type { EvaluatedModuleNode } from '../../../../module-runner/evaluatedModules'
import { ModuleRunner } from '../../../../module-runner/runner'
import { promiseWithResolvers } from '../../../../shared/utils'
import { createServer, type ViteDevServer } from '../../../server'
import { isRunnableDevEnvironment } from '../../../server/environments/runnableEnvironment'
import { createServerModuleRunnerTransport } from '../serverModuleRunner'

async function createFixture(
  files: Record<string, string> = {},
  staticImports = false,
  beforeLoad?: (id: string) => Promise<void>,
) {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), 'vite-ssr-full-reload-')),
  )
  const key = `__vite_ssr_full_reload_${randomUUID()}`
  const hook = `globalThis[${JSON.stringify(key)}]`
  const gates = Array.from({ length: 3 }, () => promiseWithResolvers<void>())
  const started = Array.from({ length: 3 }, () => promiseWithResolvers<void>())
  const reloads = Array.from({ length: 2 }, () => promiseWithResolvers<any>())
  const requests: Promise<any>[] = []
  const updated = promiseWithResolvers<void>()
  const accepted: number[] = []
  const disposed: number[] = []
  const resources: { server?: ViteDevServer } = {}
  let evaluations = 0
  let reloadCount = 0
  let nextId = 0
  const testGlobal = globalThis as any
  testGlobal[key] = {
    id: () => ++nextId,
    accept(id: number) {
      accepted.push(id)
    },
    dispose(id: number) {
      disposed.push(id)
    },
    updated: updated.resolve,
    reload(payload: any) {
      reloads[reloadCount++].resolve(payload)
    },
    wait() {
      const index = evaluations++
      started[index].resolve()
      return gates[index].promise
    },
  }
  onTestFinished(async () => {
    for (const gate of gates) gate.resolve()
    await Promise.allSettled(requests)
    try {
      await resources.server?.close()
    } finally {
      delete testGlobal[key]
      await rm(root, { recursive: true, force: true })
    }
  })
  await mkdir(join(root, 'src'))
  const listener = `import.meta.hot.on('vite:beforeFullReload', payload => ${hook}.reload(payload))`
  const dependencyImports = staticImports
    ? `
      import './slow.js'
      import * as b from './b.js'
    `
    : `
      ${listener}
      import.meta.hot.on('vite:afterUpdate', ${hook}.updated)
      await import('./slow.js')
      const b = await import('./b.js')
    `
  const fixtures: Record<string, string> = {
    'other.js': 'export const value = 0',
    'registry.js': `
      export const registry = { id: ${hook}.id() }
      export let count = 0
      export function increment() { count++ }
      ${staticImports ? listener : ''}
    `,
    'slow.js': `await ${hook}.wait()`,
    'b.js': `export { registry, count, increment } from './registry.js'`,
    'app.js': `
      import { value } from './other.js'
      import * as state from './registry.js'
      ${dependencyImports}
      export const registry = state.registry
      export const bRegistry = b.registry
      export { state, b, value }
    `,
    ...files,
  }
  for (const [file, code] of Object.entries(fixtures)) {
    await writeFile(join(root, 'src', file), code.replaceAll('__HOOK__', hook))
  }
  const server = await createServer({
    root,
    configFile: false,
    envFile: false,
    publicDir: false,
    cacheDir: join(root, '.cache'),
    logLevel: 'silent',
    server: {
      middlewareMode: true,
      ws: false,
      watch: {
        usePolling: true,
        interval: 10,
        awaitWriteFinish: { stabilityThreshold: 60, pollInterval: 10 },
      },
    },
    optimizeDeps: { noDiscovery: true, include: [] },
    plugins: beforeLoad
      ? [
          {
            name: 'delay-fixture-load',
            async load(id) {
              await beforeLoad(id)
              return null
            },
          },
        ]
      : [],
  })
  resources.server = server
  const environment = server.environments.ssr
  assert(isRunnableDevEnvironment(environment))
  const runner = environment.runner
  if (!(server.watcher as any)._readyEmitted) {
    await new Promise<void>((resolve) => server.watcher.once('ready', resolve))
  }
  return {
    environment,
    runner,
    gates,
    started,
    accepted,
    disposed,
    updated: updated.promise,
    async edit(file: string, code: string) {
      await writeFile(
        join(root, 'src', file),
        code.replaceAll('__HOOK__', hook),
      )
    },
    async reload(index = 0) {
      await writeFile(
        join(root, 'src/other.js'),
        `export const value = ${index + 1}\n${'// reload\n'.repeat(index + 1)}`,
      )
      const payload = await reloads[index].promise
      expect(payload.triggeredBy).toBe(join(root, 'src/other.js'))
      await started[index + 1].promise
    },
    import() {
      const request = runner.import('/src/app.js')
      request.catch(() => {})
      requests.push(request)
      return request
    },
  }
}

test.each([false, true])(
  'keeps in-flight module identities across a real full reload (static imports: %s)',
  async (staticImports) => {
    const fixture = await createFixture({}, staticImports)
    const first = fixture.import()
    await fixture.started[0].promise
    await fixture.reload()
    const second = fixture.import()
    fixture.gates[1].resolve()
    const fresh = await second
    expect(fresh.registry).toBe(fresh.bRegistry)
    expect(fresh.value).toBe(1)
    fixture.gates[0].resolve()
    const old = await first
    expect(old.registry).toBe(old.bRegistry)
    expect(old.registry).not.toBe(fresh.registry)
    expect(old.value).toBe(0)
    old.state.increment()
    expect(old.b.count).toBe(1)
    expect(fresh.b.count).toBe(0)
  },
)

test('deduplicates concurrent imports without a reload', async () => {
  const fixture = await createFixture()
  const first = fixture.import()
  await fixture.started[0].promise
  const second = fixture.import()
  fixture.gates[0].resolve()
  expect(await first).toBe(await second)
})

test('keeps separate graphs through consecutive full reloads', async () => {
  const fixture = await createFixture()
  const first = fixture.import()
  await fixture.started[0].promise
  await fixture.reload()
  const second = fixture.import()
  fixture.gates[1].resolve()
  const middle = await second
  await fixture.reload(1)
  const third = fixture.import()
  fixture.gates[2].resolve()
  const fresh = await third
  fixture.gates[0].resolve()
  const old = await first
  expect(old.registry).toBe(old.bRegistry)
  expect(middle.registry).toBe(middle.bRegistry)
  expect(fresh.registry).toBe(fresh.bRegistry)
  expect(new Set([old.registry, middle.registry, fresh.registry]).size).toBe(3)
  expect(fresh.value).toBe(2)
})

test('propagates errors from an old graph after a fresh import completes', async () => {
  const fixture = await createFixture({
    'b.js': `
      import { registry } from './registry.js'
      if (registry.id === 1) throw new Error('old graph failure')
      export { registry }
    `,
  })
  const first = fixture.import()
  await fixture.started[0].promise
  await fixture.reload()
  const second = fixture.import()
  fixture.gates[1].resolve()
  expect((await second).registry.id).toBe(2)
  fixture.gates[0].resolve()
  await expect(first).rejects.toThrow('old graph failure')
})

test('close completes while an old evaluation is waiting', async () => {
  const fixture = await createFixture()
  const first = fixture.import()
  await fixture.started[0].promise
  await fixture.runner.close()
  expect(fixture.runner.isClosed()).toBe(true)
  fixture.gates[0].resolve()
  await expect(first).rejects.toThrow('Vite module runner has been closed')
})

test.each([false, true])(
  'old HMR contexts preserve current callbacks (captured: %s)',
  async (captured) => {
    const code = `
    import { registry } from './registry.js'
    export { registry }
    const hot = import.meta.hot
    ${captured ? 'await __HOOK__.wait()' : ''}
    hot.dispose(() => __HOOK__.dispose(registry.id))
    import.meta.hot.accept(() => __HOOK__.accept(registry.id))
  `
    const fixture = await createFixture({
      'b.js': code,
      ...(captured ? { 'slow.js': '' } : {}),
    })
    const first = fixture.import()
    await fixture.started[0].promise
    await fixture.reload()
    const second = fixture.import()
    fixture.gates[1].resolve()
    await second
    fixture.gates[0].resolve()
    await first
    fixture.gates[2].resolve()
    await fixture.edit('b.js', `${code}\n// update the current graph\n`)
    await fixture.updated
    expect(fixture.accepted).toStrictEqual([2])
    expect(fixture.disposed).toStrictEqual([2])
  },
)

test.each([
  { captured: false, oldFirst: true },
  { captured: true, oldFirst: true },
  { captured: false, oldFirst: false },
  { captured: true, oldFirst: false },
])(
  'preserves hot.data across reloads (captured: $captured, old first: $oldFirst)',
  async ({ captured, oldFirst }) => {
    const code = `
      import { registry } from './registry.js'
      export { registry }
      const hot = import.meta.hot
      export const data = hot.data
      data.initialized ??= registry.id
      export function readData() { return hot.data }
      ${captured ? 'await __HOOK__.wait()' : ''}
      hot.dispose(data => {
        data.disposed = registry.id
        __HOOK__.dispose(registry.id)
      })
      import.meta.hot.accept(() => __HOOK__.accept(registry.id))
    `
    const fixture = await createFixture({
      'b.js': code,
      ...(captured ? { 'slow.js': '' } : {}),
    })
    const first = fixture.import()
    await fixture.started[0].promise
    await fixture.reload()
    const second = fixture.import()
    const firstCompleted = oldFirst ? first : second
    fixture.gates[oldFirst ? 0 : 1].resolve()
    const completed = await firstCompleted
    expect(completed.b.data).toStrictEqual({
      initialized: captured || oldFirst ? 1 : 2,
    })
    expect(completed.b.readData()).toBe(completed.b.data)
    fixture.gates[oldFirst ? 1 : 0].resolve()
    const [old, fresh] = await Promise.all([first, second])
    expect(old.registry).toBe(old.bRegistry)
    expect(fresh.registry).toBe(fresh.bRegistry)
    expect(old.registry).not.toBe(fresh.registry)
    expect(old.b.readData()).toBe(old.b.data)
    expect(fresh.b.readData()).toBe(old.b.data)
    expect(fresh.b.data).toBe(old.b.data)

    fixture.gates[2].resolve()
    await fixture.edit('b.js', `${code}\n// update the current graph\n`)
    await fixture.updated
    expect(fixture.accepted).toStrictEqual([2])
    expect(fixture.disposed).toStrictEqual([2])
    expect(old.b.readData()).toBe(old.b.data)
    expect(old.b.data.disposed).toBe(2)
    const updated = await fixture.import()
    expect(updated.b.data).toBe(old.b.data)
    expect(updated.b.readData()).toBe(old.b.data)
  },
)

test('resolves alternate URLs in the retained graph', async () => {
  const fixture = await createFixture({
    'b.js': `export const { registry } = await import(new URL('./registry.js', import.meta.url).href)`,
  })
  const first = fixture.import()
  await fixture.started[0].promise
  await fixture.reload()
  const second = fixture.import()
  fixture.gates[1].resolve()
  const fresh = await second
  fixture.gates[0].resolve()
  const old = await first
  expect(old.registry).toBe(old.bRegistry)
  expect(fresh.registry).toBe(fresh.bRegistry)
  expect(old.registry).not.toBe(fresh.registry)
})

test('keeps pending fetches in their original graph', async () => {
  const fetching = promiseWithResolvers<void>()
  const fetched = promiseWithResolvers<void>()
  const fixture = await createFixture({}, false, async (id) => {
    if (id.endsWith('/src/b.js')) {
      fetching.resolve()
      await fetched.promise
    }
  })
  fixture.gates.push(fetched)
  const first = fixture.import()
  await fixture.started[0].promise
  fixture.gates[0].resolve()
  await fetching.promise
  await fixture.reload()
  const second = fixture.import()
  fixture.gates[1].resolve()
  fetched.resolve()
  const [old, fresh] = await Promise.all([first, second])
  expect(old.registry).toBe(old.bRegistry)
  expect(fresh.registry).toBe(fresh.bRegistry)
  expect(old.registry).not.toBe(fresh.registry)
})

test.each([false, true])(
  'preserves TLA cycle behavior across reloads (invalid: %s)',
  async (invalid) => {
    const fixture = await createFixture({
      'b.js': `
      import { registry } from './registry.js'
      import { getRegistry } from './cycle.js'
      await Promise.resolve()
      export const own = registry
      export { registry, getRegistry }
    `,
      'cycle.js': `
      import { own as registry } from './b.js'
      await Promise.resolve()
      ${invalid ? 'export const value = registry.id' : ''}
      export function getRegistry() { return registry }
    `,
    })
    const first = fixture.import()
    await fixture.started[0].promise
    await fixture.reload()
    const second = fixture.import()
    fixture.gates[1].resolve()
    if (invalid) {
      await expect(second).rejects.toBeInstanceOf(TypeError)
      fixture.gates[0].resolve()
      await expect(first).rejects.toBeInstanceOf(TypeError)
    } else {
      const fresh = await second
      fixture.gates[0].resolve()
      const old = await first
      expect(old.b.getRegistry()).toBe(old.registry)
      expect(fresh.b.getRegistry()).toBe(fresh.registry)
      expect(old.registry).not.toBe(fresh.registry)
    }
  },
)

test('clearCache retains pending graph identities and starts a fresh graph', async () => {
  const fixture = await createFixture()
  const first = fixture.import()
  await fixture.started[0].promise
  fixture.runner.clearCache()
  const second = fixture.import()
  await fixture.started[1].promise
  fixture.gates[1].resolve()
  const fresh = await second
  fixture.gates[0].resolve()
  const old = await first
  expect(old.registry).toBe(old.bRegistry)
  expect(fresh.registry).toBe(fresh.bRegistry)
  expect(old.registry).not.toBe(fresh.registry)
})

test('keeps rejected old evaluations observable', async () => {
  const fixture = await createFixture()
  const first = fixture.import()
  await fixture.started[0].promise
  await fixture.reload()
  const second = fixture.import()
  fixture.gates[1].resolve()
  const fresh = await second
  const failure = new Error('old evaluation rejected')
  fixture.gates[0].reject(failure)
  await expect(first).rejects.toBe(failure)
  expect(fresh.registry).toBe(fresh.bRegistry)
})

test('preserves directRequest overrides and the supplied public cache', async () => {
  class CustomRunner extends ModuleRunner {
    calls = 0

    protected override async directRequest(
      url: string,
      mod: EvaluatedModuleNode,
      callstack: string[],
    ) {
      this.calls++
      return super.directRequest(url, mod, callstack)
    }
  }

  const fixture = await createFixture()
  const modules = new EvaluatedModules()
  const runner = new CustomRunner({
    transport: createServerModuleRunnerTransport({
      channel: fixture.environment.hot,
    }),
    evaluatedModules: modules,
    hmr: { logger: false },
    sourcemapInterceptor: false,
  })
  const requests: Promise<any>[] = []
  function startImport() {
    const request = runner.import('/src/app.js')
    request.catch(() => {})
    requests.push(request)
    return request
  }
  try {
    const first = startImport()
    await fixture.started[0].promise
    await fixture.reload()
    const second = startImport()
    fixture.gates[1].resolve()
    const fresh = await second
    fixture.gates[0].resolve()
    const old = await first
    expect(old.registry).toBe(old.bRegistry)
    expect(fresh.registry).toBe(fresh.bRegistry)
    expect(old.registry).not.toBe(fresh.registry)
    expect(runner.evaluatedModules).toBe(modules)
    expect(runner.calls).toBeGreaterThan(0)
    expect(modules.getModuleByUrl('/src/app.js')?.exports).toBe(fresh)
  } finally {
    for (const gate of fixture.gates) gate.resolve()
    await Promise.allSettled(requests)
    await runner.close()
  }
})
