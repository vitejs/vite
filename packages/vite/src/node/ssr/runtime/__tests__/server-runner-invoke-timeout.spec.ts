import { setTimeout as sleep } from 'node:timers/promises'
import type { ModuleRunnerTransport } from 'vite/module-runner'
import { ESModulesEvaluator, ModuleRunner } from 'vite/module-runner'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { ViteDevServer } from '../../../server'
import { createServer } from '../../../server'

const ENTRY = '/fixtures/transient-timeout/entry.js'

describe('transport invoke timeout does not poison the module runner', () => {
  let server: ViteDevServer
  let runner: ModuleRunner
  let transport: ModuleRunnerTransport
  // delay delivering the response for matching urls so the invoke timer
  // fires first, emulating a fetchModule that outlasts the transport timeout
  let delayResponse: ((url: unknown) => number | undefined) | undefined

  beforeEach(async () => {
    delayResponse = undefined
    server = await createServer({
      root: import.meta.dirname,
      logLevel: 'error',
      server: {
        middlewareMode: true,
        watch: null,
        ws: false,
      },
      optimizeDeps: {
        noDiscovery: true,
        include: [],
      },
    })

    let onMessage: ((payload: any) => void) | undefined
    transport = {
      timeout: 500,
      connect({ onMessage: handler }) {
        onMessage = handler
      },
      async send(payload: any) {
        const response = await server.environments.ssr.hot.handleInvoke(payload)
        const delay = delayResponse?.(payload.data.data?.[0])
        if (delay) await sleep(delay)
        onMessage!({
          type: 'custom',
          event: 'vite:invoke',
          data: {
            name: payload.data.name,
            id: payload.data.id.replace('send', 'response'),
            data: response,
          },
        })
      },
    }

    runner = new ModuleRunner(
      { transport, hmr: false, sourcemapInterceptor: false },
      new ESModulesEvaluator(),
    )
  })

  afterEach(async () => {
    await runner.close()
    await server.close()
  })

  it('recovers when a dependency fetch outlasts the invoke timeout', async () => {
    delayResponse = (url) =>
      String(url).includes('leaf.js') ? 1500 : undefined

    await expect(runner.import(ENTRY)).rejects.toMatchObject({
      code: 'ERR_TRANSPORT_INVOKE_TIMEOUT',
      message: expect.stringContaining('transport invoke timed out'),
    })

    // the transform finished on the server after the timer fired — a retry
    // must succeed instead of replaying the cached rejection
    delayResponse = undefined
    await expect(runner.import(ENTRY)).resolves.toMatchObject({
      entry: 'entry',
      middle: 'middle',
      leaf: 'leaf',
    })
  })

  it('recovers when the entry fetch itself times out', async () => {
    delayResponse = (url) =>
      String(url).includes('entry.js') ? 1500 : undefined

    await expect(runner.import(ENTRY)).rejects.toMatchObject({
      code: 'ERR_TRANSPORT_INVOKE_TIMEOUT',
    })

    delayResponse = undefined
    await expect(runner.import(ENTRY)).resolves.toMatchObject({
      entry: 'entry',
    })
  })

  it('still caches genuine evaluation errors', async () => {
    // disable the invoke timer so a slow cold transform can't interfere
    transport.timeout = 0
    delete (globalThis as any).__transient_timeout_eval_count

    const url = '/fixtures/transient-timeout/eval-error.js'
    await expect(runner.import(url)).rejects.toThrow('genuine evaluation error')
    await expect(runner.import(url)).rejects.toThrow('genuine evaluation error')
    // failed evaluations keep ESM semantics: the module ran exactly once
    expect((globalThis as any).__transient_timeout_eval_count).toBe(1)
  })
})

describe('ssrLoadModule does not record transport invoke timeouts as ssrError', () => {
  let server: ViteDevServer
  let failNestedLoad: boolean

  beforeEach(async () => {
    failNestedLoad = true
    server = await createServer({
      root: import.meta.dirname,
      logLevel: 'error',
      server: {
        middlewareMode: true,
        watch: null,
        ws: false,
      },
      optimizeDeps: {
        noDiscovery: true,
        include: [],
      },
      plugins: [
        {
          name: 'test-transient-timeout-virtual',
          resolveId(id) {
            if (id === 'virtual:transient-timeout') {
              return '\0' + id
            }
          },
          load(id) {
            if (id === '\0virtual:transient-timeout') {
              if (failNestedLoad) {
                // emulate the revived error the runner receives when a
                // dependency fetch outlasts the transport invoke timeout
                throw Object.assign(
                  new Error('transport invoke timed out after 60000ms'),
                  { code: 'ERR_TRANSPORT_INVOKE_TIMEOUT' },
                )
              }
              return 'export const ok = true'
            }
          },
        },
      ],
    })
  })

  afterEach(async () => {
    await server.close()
  })

  it('recovers once the dependency can be fetched again', async () => {
    const entry = '/fixtures/transient-timeout/ssr-compat-entry.js'
    await expect(server.ssrLoadModule(entry)).rejects.toMatchObject({
      code: 'ERR_TRANSPORT_INVOKE_TIMEOUT',
    })

    const entryModule = [
      ...server.environments.ssr.moduleGraph.idToModuleMap.values(),
    ].find((mod) => mod.id?.includes('ssr-compat-entry'))
    expect(entryModule?.ssrError).toBeNull()

    failNestedLoad = false
    const mod = await server.ssrLoadModule(entry)
    expect(mod.ok).toBe(true)
    expect(mod.compatEntry).toBe(true)
  })
})
