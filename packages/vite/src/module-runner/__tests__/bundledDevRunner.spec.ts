import { expect, test } from 'vitest'
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

test('the runner pulls an update that was pushed before it fetched its entry', async () => {
  let handlers: ModuleRunnerTransportHandlers | undefined
  const patchQueries: URLSearchParams[] = []
  const runner = new ModuleRunner({
    rolldownRuntime: true,
    hmr: { logger: false },
    sourcemapInterceptor: false,
    transport: {
      connect: (h) => {
        handlers = h
      },
      send: () => {},
      invoke: async (payload) => {
        const { name, data } = (payload as any).data
        if (name === 'getBuiltins') return { result: [] }
        const url: string = data[0]
        const [path, query] = url.slice(1).split('?')
        if (query) patchQueries.push(new URLSearchParams(query))
        return {
          result: {
            code: files[path],
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

  // The push of gen 2 comes while the server still serves the output of gen 1.
  handlers!.onMessage({
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
