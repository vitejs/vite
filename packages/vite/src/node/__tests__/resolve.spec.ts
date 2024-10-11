import { describe, expect, onTestFinished, test } from 'vitest'
import { createServer } from '../server'
import { createServerModuleRunner } from '../ssr/runtime/serverModuleRunner'

describe('import and resolveId', () => {
  async function createTestServer() {
    const server = await createServer({
      configFile: false,
      root: import.meta.dirname,
      logLevel: 'error',
      server: {
        middlewareMode: true,
      },
    })
    onTestFinished(() => server.close())
    const runner = createServerModuleRunner(server.environments.ssr, {
      hmr: {
        logger: false,
      },
      sourcemapInterceptor: false,
    })
    return { server, runner }
  }

  test('import first', async () => {
    const { server, runner } = await createTestServer()
    const mod = await runner.import(
      '/fixtures/test-dep-conditions-app/entry-with-module',
    )
    const resolved = await server.environments.ssr.pluginContainer.resolveId(
      '@vitejs/test-dep-conditions/with-module',
    )
    expect([mod.default, resolved?.id]).toEqual([
      'dir/index.default.js',
      expect.stringContaining('dir/index.module.js'),
    ])
  })

  test('resolveId first', async () => {
    const { server, runner } = await createTestServer()
    const resolved = await server.environments.ssr.pluginContainer.resolveId(
      '@vitejs/test-dep-conditions/with-module',
    )
    const mod = await runner.import(
      '/fixtures/test-dep-conditions-app/entry-with-module',
    )
    expect([mod.default, resolved?.id]).toEqual([
      'dir/index.default.js',
      expect.stringContaining('dir/index.module.js'),
    ])
  })
})
