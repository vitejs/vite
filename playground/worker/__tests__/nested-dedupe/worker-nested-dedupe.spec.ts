import path from 'node:path'
import { build } from 'vite'
import { expect, test } from 'vitest'

// Regression test: when two workers start the same nested worker while the
// first build of it is still in flight, Vite used to bundle that nested
// worker twice (https://github.com/vitejs/vite/issues/23848).
test('nested worker shared by two parents is bundled only once', async () => {
  const root = path.resolve(__dirname, '../../nested-dedupe')
  const bundledWorkerInputs: string[] = []
  await build({
    root,
    logLevel: 'silent',
    build: { write: false },
    worker: {
      format: 'es',
      plugins: () => [
        {
          name: 'log-worker-builds',
          buildStart(options) {
            const input = [options.input].flat()
            bundledWorkerInputs.push(
              ...input.map((id) => path.basename(String(id))),
            )
          },
        },
      ],
    },
  })
  expect(
    bundledWorkerInputs.filter((f) => f.startsWith('shared.js')),
  ).toHaveLength(1)
})
