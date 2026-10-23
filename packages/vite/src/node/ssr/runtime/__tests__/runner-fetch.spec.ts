import { setTimeout } from 'node:timers/promises'
import type { HotPayload } from 'vite'
import type { FetchResult, ModuleRunnerTransport } from 'vite/module-runner'
import { ModuleRunner } from 'vite/module-runner'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { promiseWithResolvers } from '../../../../shared/utils'
import { ssrTransform } from '../../ssrTransform'

interface FetchRequest {
  url: string
  cached: boolean
}

/**
 * A runner whose transport answers `fetchModule` the way the server does:
 * `{ cache: true }` while a module is unchanged, its code otherwise. URLs
 * that don't start with `/` are externalized. Every request is recorded.
 */
function createTestRunner(options: {
  files: Record<string, string>
  hmr?: boolean
  /**
   * Runs after the answer is worked out and before it is sent: await to
   * hold it back, throw to fail the request.
   */
  onFetch?: (url: string) => void | Promise<void>
}) {
  const files = { ...options.files }
  const transformed = new Set<string>()
  const requests: FetchRequest[] = []
  let onMessage: (payload: HotPayload) => void | Promise<void> = () => {}

  async function answer(url: string, cached: boolean): Promise<FetchResult> {
    if (url[0] !== '/') {
      return {
        externalize: `data:text/javascript,export default ${JSON.stringify(url)}`,
        type: 'module',
      }
    }
    const source = files[url]
    if (source === undefined) throw new Error(`Cannot find module '${url}'`)
    if (cached && transformed.has(url)) return { cache: true }
    const invalidate = !transformed.has(url)
    transformed.add(url)
    const { code } = (await ssrTransform(source, null, url, source))!
    return { code, file: null, id: url, url, invalidate }
  }

  const transport: ModuleRunnerTransport = {
    async invoke(payload: any) {
      const { name, data } = payload.data
      if (name === 'getBuiltins') return { result: [] }
      const [url, , fetchOptions] = data
      requests.push({ url, cached: !!fetchOptions?.cached })
      try {
        const result = await answer(url, !!fetchOptions?.cached)
        await options.onFetch?.(url)
        return { result }
      } catch (e) {
        return { error: { message: e.message } }
      }
    },
    connect(handlers) {
      onMessage = handlers.onMessage
    },
  }

  const runner = new ModuleRunner({
    transport,
    hmr: options.hmr === false ? false : { logger: false },
    sourcemapInterceptor: false,
  })
  onTestFinished(() => runner.close())

  return {
    runner,
    requests,
    urls: () => requests.map((request) => request.url),
    send: async (payload: HotPayload) => onMessage(payload),
    /** changes or drops a module on the server without telling the runner */
    invalidate(url: string, source = files[url]) {
      files[url] = source!
      transformed.delete(url)
    },
  }
}

/** lets a fixture pause at `await globalThis.__runnerFetchTest.wait()` */
function pauseFixture() {
  const started = promiseWithResolvers<void>()
  const released = promiseWithResolvers<void>()
  const testGlobal = globalThis as any
  testGlobal.__runnerFetchTest = {
    wait() {
      started.resolve()
      return released.promise
    },
  }
  onTestFinished(() => {
    delete testGlobal.__runnerFetchTest
  })
  return { started: started.promise, release: () => released.resolve() }
}

const pausing = `await globalThis.__runnerFetchTest.wait()`

function catchUnhandledRejections() {
  const onUnhandledRejection = vi.fn()
  process.on('unhandledRejection', onUnhandledRejection)
  onTestFinished(() => {
    process.off('unhandledRejection', onUnhandledRejection)
  })
  return onUnhandledRejection
}

describe('module runner fetching', () => {
  test('uses a module checked in the current generation without asking again', async () => {
    const { runner, requests } = createTestRunner({
      files: {
        '/entry.js': [
          `import '/a.js'`,
          `import '/b.js'`,
          `export { default as data } from 'data:text/javascript,export default "data"'`,
          `export const load = () => import('/shared.js')`,
          `export const loadBare = () => import('bare')`,
        ].join('\n'),
        '/a.js': `export { value } from '/shared.js'`,
        '/b.js': `export { value } from '/shared.js'`,
        '/shared.js': `export const value = 'shared'`,
      },
    })

    const mod = await runner.import('/entry.js')
    expect(mod.data).toBe('data')
    // `/b.js` imports `/shared.js` after `/a.js` evaluated it, and the
    // `data:` import never reaches the server
    expect(requests).toEqual([
      { url: '/entry.js', cached: false },
      { url: '/a.js', cached: false },
      { url: '/b.js', cached: false },
      { url: '/shared.js', cached: false },
    ])

    requests.length = 0
    expect((await mod.load()).value).toBe('shared')
    expect(requests).toEqual([])

    // the server resolves a bare specifier against its importer, so the
    // runner always asks
    await mod.loadBare()
    await mod.loadBare()
    expect(requests).toEqual([
      { url: 'bare', cached: false },
      { url: 'bare', cached: true },
    ])

    // `runner.import` always asks, so the server can report a change to
    // the entry or to anything that it imports
    requests.length = 0
    await runner.import('/entry.js')
    expect(requests).toEqual([{ url: '/entry.js', cached: true }])
  })

  test('asks again after an HMR message', async () => {
    const { runner, requests, send } = createTestRunner({
      files: {
        '/entry.js': `import '/shared.js'; export const load = () => import('/shared.js')`,
        '/shared.js': `export const value = 'shared'`,
      },
    })
    const mod = await runner.import('/entry.js')
    requests.length = 0

    await send({ type: 'ping' })
    await send({ type: 'custom', event: 'test', data: {} })
    await mod.load()
    expect(requests).toEqual([])

    await send({ type: 'update', updates: [] })
    await mod.load()
    expect(requests).toEqual([{ url: '/shared.js', cached: true }])

    // confirmed again in the new generation
    await mod.load()
    expect(requests).toHaveLength(1)
  })

  test('notices a change the server made without an HMR message', async () => {
    const { runner, invalidate } = createTestRunner({
      files: {
        '/entry.js': `export { value } from '/middle.js'`,
        '/middle.js': `export { value } from '/dep.js'`,
        '/dep.js': `export const value = 1`,
      },
    })
    expect((await runner.import('/entry.js')).value).toBe(1)

    // as when a plugin invalidates a module: the server drops it and its
    // importers, and sends nothing
    invalidate('/dep.js', `export const value = 2`)
    invalidate('/middle.js')
    invalidate('/entry.js')

    expect((await runner.import('/entry.js')).value).toBe(2)
  })

  test.for([
    'while the import waits for it',
    'before evaluation reaches the import',
  ])(
    'does not use an answer requested before a newer HMR message and delivered %s',
    async (when) => {
      const { started, release } = pauseFixture()
      const held = promiseWithResolvers<void>()
      const { runner, requests, send, invalidate } = createTestRunner({
        files: {
          '/entry.js': `import '/a.js'; export { value } from '/b.js'`,
          '/a.js': pausing,
          '/b.js': `export const value = 1`,
        },
        onFetch: (url) => (url === '/b.js' ? held.promise : undefined),
      })

      const result = runner.import('/entry.js')
      await started
      // the prefetch of `/b.js` has its answer but has not delivered it
      await vi.waitUntil(() => requests.some((r) => r.url === '/b.js'))
      invalidate('/b.js', `export const value = 2`)
      await send({ type: 'update', updates: [] })

      if (when === 'while the import waits for it') {
        release()
        await setTimeout() // the entry is now waiting on `/b.js`
        held.resolve()
      } else {
        held.resolve()
        await setTimeout() // the old answer is now in the module graph
        release()
      }

      expect((await result).value).toBe(2)
      expect(requests.filter((r) => r.url === '/b.js')).toEqual([
        { url: '/b.js', cached: false },
        { url: '/b.js', cached: true },
      ])
    },
  )

  test('requests static imports before the importer finishes evaluating', async () => {
    const { started, release } = pauseFixture()
    const { runner, requests, urls } = createTestRunner({
      files: {
        '/entry.js': `import '/a.js'; import { b } from '/b.js'; import { c } from '/c.js'; export const value = b + c`,
        '/a.js': pausing,
        '/b.js': `export const b = 'b'`,
        '/c.js': `export { c } from '/d.js'`,
        '/d.js': `export const c = 'c'`,
      },
    })

    const result = runner.import('/entry.js')
    await started
    // `/a.js` is still evaluating; `/d.js` is an import of a prefetched module
    await vi.waitUntil(() =>
      ['/b.js', '/c.js', '/d.js'].every((url) => urls().includes(url)),
    )
    release()

    expect((await result).value).toBe('bc')
    expect(urls().sort()).toEqual([
      '/a.js',
      '/b.js',
      '/c.js',
      '/d.js',
      '/entry.js',
    ])
    expect(requests.every((request) => !request.cached)).toBe(true)
  })

  test('sends at most 16 prefetches at a time', async () => {
    const gate = promiseWithResolvers<void>()
    const names = Array.from({ length: 40 }, (_, i) => `/m${i}.js`)
    const { runner, urls } = createTestRunner({
      files: {
        '/entry.js': names.map((url) => `import '${url}'`).join('\n'),
        ...Object.fromEntries(names.map((url) => [url, ''])),
      },
      onFetch: (url) => (url === '/entry.js' ? undefined : gate.promise),
    })

    const result = runner.import('/entry.js')
    await vi.waitUntil(() => urls().length > 1)
    await setTimeout()
    // the entry waits on the prefetch of `/m0.js` rather than sending its own
    expect(urls()).toEqual(['/entry.js', ...names.slice(0, 16)])

    gate.resolve()
    await result
    expect(urls().sort()).toEqual(['/entry.js', ...names].sort())
  })

  test('records the importer of a prefetched module that was never imported', async () => {
    const { runner, urls, send } = createTestRunner({
      files: {
        '/entry.js': `import '/throws.js'; import '/c.js'`,
        '/throws.js': `throw new Error('fails')`,
        '/c.js': `export const c = 'c'`,
      },
    })
    await expect(runner.import('/entry.js')).rejects.toThrow('fails')
    const c = await vi.waitUntil(() =>
      runner.evaluatedModules.getModuleByUrl('/c.js'),
    )
    expect(c.evaluated).toBe(false)
    expect([...c.importers]).toEqual(['/entry.js'])

    // a full reload starts again from the entry, not from `/c.js`
    const before = urls().length
    await send({ type: 'full-reload', path: '*', triggeredBy: '/c.js' })
    expect(urls()[before]).toBe('/entry.js')
  })

  test('does not ask again or prefetch without HMR', async () => {
    const { started, release } = pauseFixture()
    const { runner, requests, urls } = createTestRunner({
      hmr: false,
      files: {
        '/entry.js': `import '/a.js'; import '/b.js'; export const load = () => import('/b.js')`,
        '/a.js': pausing,
        '/b.js': `export const value = 'b'`,
      },
    })

    const result = runner.import('/entry.js')
    await started
    await setTimeout()
    expect(urls()).toEqual(['/entry.js', '/a.js'])
    release()
    const mod = await result

    requests.length = 0
    await mod.load()
    expect(requests).toEqual([{ url: '/b.js', cached: true }])
  })

  test('fetches again when a prefetch fails, without unhandled rejections', async () => {
    const onUnhandledRejection = catchUnhandledRejections()
    const { started, release } = pauseFixture()
    let failures = 1
    const { runner, urls } = createTestRunner({
      files: {
        '/entry.js': `import '/a.js'; export { value } from '/flaky.js'`,
        '/a.js': pausing,
        '/flaky.js': `export const value = 'ok'`,
      },
      onFetch(url) {
        if (url === '/flaky.js' && failures-- > 0) {
          throw new Error('flaky failure')
        }
      },
    })

    const result = runner.import('/entry.js')
    await started
    await vi.waitUntil(() => urls().includes('/flaky.js'))
    await setTimeout() // the prefetch has failed
    release()

    expect((await result).value).toBe('ok')
    expect(urls().filter((url) => url === '/flaky.js')).toHaveLength(2)
    expect(onUnhandledRejection).not.toHaveBeenCalled()
  })

  test('reports the error of a module whose prefetch failed', async () => {
    const onUnhandledRejection = catchUnhandledRejections()
    const { started, release } = pauseFixture()
    const { runner, urls } = createTestRunner({
      files: {
        '/entry.js': `import '/a.js'; import '/missing.js'`,
        '/a.js': pausing,
      },
    })

    const result = runner.import('/entry.js')
    await started
    await vi.waitUntil(() => urls().includes('/missing.js'))
    await setTimeout() // the prefetch has failed
    release()

    await expect(result).rejects.toThrow(`Cannot find module '/missing.js'`)
    expect(urls().filter((url) => url === '/missing.js')).toHaveLength(2)
    expect(onUnhandledRejection).not.toHaveBeenCalled()
  })

  test('closes while prefetches are in flight', async () => {
    const onUnhandledRejection = catchUnhandledRejections()
    const { started, release } = pauseFixture()
    const held = promiseWithResolvers<void>()
    const pending = promiseWithResolvers<void>()
    const { runner } = createTestRunner({
      files: {
        '/entry.js': `import '/a.js'; import '/b.js'`,
        '/a.js': pausing,
        '/b.js': `export const value = 'b'`,
      },
      onFetch(url) {
        if (url === '/b.js') {
          held.resolve()
          return pending.promise
        }
      },
    })

    const result = runner.import('/entry.js')
    await started
    await held.promise // the prefetch of `/b.js` is in flight

    await runner.close()
    pending.reject(new Error('transport closed'))
    await setTimeout() // the prefetch has failed
    release()

    await expect(result).rejects.toThrow('Vite module runner has been closed.')
    expect(onUnhandledRejection).not.toHaveBeenCalled()
  })
})
