import { expect, onTestFinished, test, vi } from 'vitest'
import type { HotPayload } from '#types/hmrPayload'
import type { ModuleRunnerTransportHandlers } from '../../shared/moduleRunnerTransport'
import { ModuleRunner } from '../runner'

/**
 * The output at gen 1 runs `main.js -> dep.js`, and `dep.js` accepts itself.
 * Every patch brings the catch-up of gen 2, which changed `dep.js`.
 */
const files: Record<string, string> = {
  'main.js': `
    __rolldown_runtime__.registerGraph({ ids: ['main.js', 'dep.js'], localCount: 2, edges: [[1], []], nums: [0, 1], epoch: 7, entries: [0] });
    const dep_hot = __rolldown_runtime__.createModuleHotContext('dep.js');
    __rolldown_runtime__.registerModule('dep.js', { exports: { value: 'old' } });
    dep_hot.accept();
    __rolldown_runtime__.createModuleHotContext('main.js');
    __rolldown_runtime__.registerModule('main.js', { exports: { get value() { return __rolldown_runtime__.loadExports('dep.js').value } } });
  `,
  '__rolldown_hmr_patch.js': `
    const __rolldown_payload__ = __rolldown_runtime__.beginPayload(2);
    __rolldown_payload__.catchUp([{ gen: 2, changedIds: ['dep.js'], staleIds: ['dep.js'] }]);
    __rolldown_payload__.registerGraph({ ids: ['dep.js'], localCount: 1, edges: [[]], nums: [1] });
    __rolldown_payload__.registerFactory('dep.js', (id) => {
      const hot = __rolldown_runtime__.createModuleHotContext(id);
      __rolldown_runtime__.registerModule(id, { exports: { value: 'new' } });
      hot.accept();
    });
  `,
}

function createRunner() {
  let handlers: ModuleRunnerTransportHandlers | undefined
  const patchQueries: URLSearchParams[] = []
  const sent: HotPayload[] = []
  // when set, a patch request waits for this body
  const held: { patch?: Promise<string> } = {}
  const runner = new ModuleRunner({
    rolldownRuntime: true,
    hmr: { logger: false },
    sourcemapInterceptor: false,
    transport: {
      connect: (h) => {
        handlers = h
      },
      send: (payload) => {
        sent.push(payload)
      },
      invoke: async (payload) => {
        const { name, data } = (payload as any).data
        if (name === 'getBuiltins') return { result: [] }
        if (name === 'resetBundledDevClient') return { result: undefined }
        const url: string = data[0]
        const [path, query] = url.slice(1).split('?')
        if (query) patchQueries.push(new URLSearchParams(query))
        const code = (query && held.patch && (await held.patch)) || files[path]
        return {
          result: {
            code,
            url,
            id: url,
            file: `/out/${path}`,
            invalidate: false,
            rolldownModuleId: path === 'main.js' ? 'main.js' : undefined,
            rolldownGeneration: path === 'main.js' ? 1 : undefined,
          },
        }
      },
    },
  })
  return { runner, handlers: handlers!, patchQueries, sent, held }
}

test('the runner pulls an update that was pushed before it fetched its entry', async () => {
  const { runner, handlers, patchQueries } = createRunner()

  // The push of gen 2 comes while the server still serves the output of gen 1.
  handlers.onMessage({
    type: 'bundled-dev-update',
    changedIds: ['dep.js'],
    staleIds: ['dep.js'],
    gen: 2,
    seq: 1,
  } satisfies HotPayload)
  await new Promise((resolve) => setTimeout(resolve))

  const main = await runner.import('/main.js')
  expect(main.value).toBe('new')
  expect(patchQueries[0].get('g')).toBe('1')
  await runner.close()
})

test('the runner sends a long query in the request and never posts it', async () => {
  const fetch = vi.fn()
  vi.stubGlobal('fetch', fetch)
  onTestFinished(() => {
    vi.unstubAllGlobals()
  })
  const { runner, patchQueries } = createRunner()
  await runner.import('/main.js')

  // 60000 executed modules: the set `e` alone is a bitset of 10000 characters.
  const runtime = (runner as any).rolldownDevRuntime
  const ids = Array.from({ length: 60000 }, (_, i) => `m${i}.js`)
  runtime.registerGraph({
    ids,
    localCount: ids.length,
    edges: ids.map(() => []),
    nums: ids.map((_, i) => i + 2),
  })
  for (const id of ids) runtime.registerModule(id, { exports: {} })
  await runtime.pullPatch(new Set(['dep.js']))

  expect(fetch).not.toHaveBeenCalled()
  expect(patchQueries.at(-1)!.get('e')!.length).toBeGreaterThan(6000)
  await runner.close()
})

test('a payload requested before a full reload runs against the runtime that asked for it', async () => {
  const { runner, sent, held } = createRunner()
  await runner.import('/main.js')
  const oldRuntime = (runner as any).rolldownDevRuntime

  let answer!: (code: string) => void
  held.patch = new Promise((resolve) => {
    answer = resolve
  })
  const pull = oldRuntime.pullPatch(new Set(['dep.js']))
  await runner._resetBundledDevRuntime()
  const newRuntime = (runner as any).rolldownDevRuntime
  expect(newRuntime).not.toBe(oldRuntime)

  answer('__rolldown_runtime__.reloadNeeded("x")')
  await pull

  expect(oldRuntime.reloadReason).toBe('x')
  expect(newRuntime.reloadReason).toBeUndefined()
  expect(
    sent.filter(
      (p) =>
        p.type === 'custom' && p.event === 'vite:bundled-dev:reload-needed',
    ),
  ).toStrictEqual([])
  await runner.close()
})
