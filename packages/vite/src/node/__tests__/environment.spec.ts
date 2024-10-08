import { describe, expect, test } from 'vitest'
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
        worker: {
          webCompatible: true,
          resolve: {
            noExternal: true,
            conditions: ['worker'],
          },
        },
        custom1: {
          webCompatible: true,
          resolve: {
            noExternal: true,
            conditions: ['custom1'],
          },
        },
        custom2: {
          webCompatible: false,
          resolve: {
            noExternal: true,
            conditions: ['custom2'],
          },
        },
        custom3: {
          webCompatible: false,
          resolve: {
            noExternal: true,
            conditions: ['custom3'],
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
    const builder = createBuilder(getConfig())
    console.log(builder)
  })
})
