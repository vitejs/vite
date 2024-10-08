import path from 'node:path'
import { describe, expect, test } from 'vitest'
import type { RollupOutput } from 'rollup'
import { createServer } from '../server'
import { defineConfig } from '../config'
import { createBuilder } from '../build'
import { createServerModuleRunner } from '../ssr/runtime/serverModuleRunner'

describe('custom environment conditions', () => {
  function getConfig() {
    return defineConfig({
      root: import.meta.dirname,
      logLevel: 'error',
      environments: {
        ssr: {
          resolve: {
            noExternal: true,
          },
          build: {
            outDir: path.join(
              import.meta.dirname,
              'fixtures/test-dep-conditions/dist/ssr',
            ),
            rollupOptions: {
              input: { index: '@vitejs/test-dep-conditions' },
            },
          },
        },
        worker: {
          webCompatible: true,
          resolve: {
            noExternal: true,
            conditions: ['worker'],
          },
          build: {
            outDir: path.join(
              import.meta.dirname,
              'fixtures/test-dep-conditions/dist/worker',
            ),
            rollupOptions: {
              input: { index: '@vitejs/test-dep-conditions' },
            },
          },
        },
        custom1: {
          webCompatible: true,
          resolve: {
            noExternal: true,
            conditions: ['custom1'],
          },
          build: {
            outDir: path.join(
              import.meta.dirname,
              'fixtures/test-dep-conditions/dist/custom1',
            ),
            rollupOptions: {
              input: { index: '@vitejs/test-dep-conditions' },
            },
          },
        },
        custom2: {
          webCompatible: false,
          resolve: {
            noExternal: true,
            conditions: ['custom2'],
          },
          build: {
            outDir: path.join(
              import.meta.dirname,
              'fixtures/test-dep-conditions/dist/custom2',
            ),
            rollupOptions: {
              input: { index: '@vitejs/test-dep-conditions' },
            },
          },
        },
        custom3: {
          webCompatible: false,
          resolve: {
            noExternal: true,
            conditions: ['custom3'],
          },
          build: {
            outDir: path.join(
              import.meta.dirname,
              'fixtures/test-dep-conditions/dist/custom3',
            ),
            rollupOptions: {
              input: { index: '@vitejs/test-dep-conditions' },
            },
          },
        },
      },
    })
  }

  test('dev', async () => {
    const server = await createServer(getConfig())
    const results: Record<string, unknown> = {}
    for (const key of ['ssr', 'worker', 'custom1', 'custom2', 'custom3']) {
      const runner = createServerModuleRunner(server.environments[key], {
        hmr: {
          logger: false,
        },
        sourcemapInterceptor: false,
      })
      const mod = await runner.import('@vitejs/test-dep-conditions')
      results[key] = mod.default
    }
    expect(results).toMatchInlineSnapshot(`
      {
        "custom1": "index.custom1.js",
        "custom2": "index.custom2.js",
        "custom3": "index.custom3.js",
        "ssr": "index.default.js",
        "worker": "index.worker.js",
      }
    `)
  })

  test('build', async () => {
    const builder = await createBuilder(getConfig())
    const results: Record<string, unknown> = {}
    for (const key of ['ssr', 'worker', 'custom1', 'custom2', 'custom3']) {
      const output = await builder.build(builder.environments[key])
      const chunk = (output as RollupOutput).output[0]
      const mod = await import(
        path.join(
          import.meta.dirname,
          'fixtures/test-dep-conditions/dist',
          key,
          chunk.fileName,
        )
      )
      results[key] = mod.default
    }
    expect(results).toMatchInlineSnapshot(`
      {
        "custom1": "index.custom1.js",
        "custom2": "index.custom2.js",
        "custom3": "index.custom3.js",
        "ssr": "index.default.js",
        "worker": "index.worker.js",
      }
    `)
  })
})
