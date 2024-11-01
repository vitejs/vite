import path from 'node:path'
import { describe, expect, onTestFinished, test } from 'vitest'
import type { RollupOutput } from 'rollup'
import { createServer } from '../server'
import type { InlineConfig } from '../config'
import { createBuilder } from '../build'
import { createServerModuleRunner } from '../ssr/runtime/serverModuleRunner'

describe('custom environment conditions', () => {
  function getConfig({
    noExternal,
  }: {
    noExternal: true | undefined
  }): InlineConfig {
    return {
      configFile: false,
      root: import.meta.dirname,
      logLevel: 'error',
      server: {
        middlewareMode: true,
        ws: false,
      },
      environments: {
        // default
        ssr: {
          resolve: {
            noExternal,
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
        // worker
        worker: {
          resolve: {
            noExternal,
            conditions: ['worker'],
            externalConditions: ['worker'],
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
        // custom1
        custom1: {
          resolve: {
            noExternal,
            conditions: ['custom1'],
            externalConditions: ['custom1'],
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
        // same as custom1
        custom1_2: {
          resolve: {
            noExternal,
            conditions: ['custom1'],
            externalConditions: ['custom1'],
          },
          build: {
            outDir: path.join(
              import.meta.dirname,
              'fixtures/test-dep-conditions/dist/custom1_2',
            ),
            rollupOptions: {
              input: { index: '@vitejs/test-dep-conditions' },
            },
          },
        },
      },
    }
  }

  test('dev noExternal', async () => {
    const server = await createServer(getConfig({ noExternal: true }))
    onTestFinished(() => server.close())

    const results: Record<string, unknown> = {}
    for (const key of ['ssr', 'worker', 'custom1', 'custom1_2']) {
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
        "custom1_2": "index.custom1.js",
        "ssr": "index.default.js",
        "worker": "index.worker.js",
      }
    `)
  })

  test('dev external', async () => {
    const server = await createServer(getConfig({ noExternal: undefined }))
    onTestFinished(() => server.close())

    const results: Record<string, unknown> = {}
    for (const key of ['ssr', 'worker', 'custom1', 'custom1_2']) {
      const runner = createServerModuleRunner(server.environments[key], {
        hmr: {
          logger: false,
        },
        sourcemapInterceptor: false,
      })
      const mod = await runner.import(
        '/fixtures/test-dep-conditions-app/entry.js',
      )
      results[key] = mod.default
    }
    expect(results).toMatchInlineSnapshot(`
      {
        "custom1": "index.custom1.js",
        "custom1_2": "index.custom1.js",
        "ssr": "index.default.js",
        "worker": "index.worker.js",
      }
    `)
  })

  test('css', async () => {
    const server = await createServer(getConfig({ noExternal: true }))
    onTestFinished(() => server.close())

    const modJs = await server.ssrLoadModule(
      '/fixtures/test-dep-conditions-app/entry.js',
    )
    const modCss = await server.ssrLoadModule(
      '/fixtures/test-dep-conditions-app/entry.css?inline',
    )
    expect([modCss.default.replace(/\s+/g, ' '), modJs.default])
      .toMatchInlineSnapshot(`
      [
        ".test-css { color: orange; } ",
        "index.default.js",
      ]
    `)
  })

  test('build', async () => {
    const builder = await createBuilder(getConfig({ noExternal: true }))
    const results: Record<string, unknown> = {}
    for (const key of ['ssr', 'worker', 'custom1', 'custom1_2']) {
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
        "custom1_2": "index.custom1.js",
        "ssr": "index.default.js",
        "worker": "index.worker.js",
      }
    `)
  })
})
