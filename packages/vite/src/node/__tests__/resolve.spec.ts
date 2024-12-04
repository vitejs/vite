import { join } from 'node:path'
import { describe, expect, onTestFinished, test } from 'vitest'
import { createServer } from '../server'
import { createServerModuleRunner } from '../ssr/runtime/serverModuleRunner'
import type { EnvironmentOptions, InlineConfig } from '../config'
import { build } from '../build'

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

describe('file url', () => {
  const fileUrl = new URL('./fixtures/file-url/entry.js', import.meta.url)

  function getConfig(): InlineConfig {
    return {
      configFile: false,
      root: join(import.meta.dirname, 'fixtures/file-url'),
      logLevel: 'error',
      server: {
        middlewareMode: true,
      },
      plugins: [
        {
          name: 'virtual-file-url',
          resolveId(source) {
            if (source.startsWith('virtual:test-dep/')) {
              return '\0' + source
            }
          },
          load(id) {
            if (id === '\0virtual:test-dep/static') {
              return `
                import * as dep from ${JSON.stringify(fileUrl.href)};
                export default dep;
              `
            }
            if (id === '\0virtual:test-dep/non-static') {
              return `
                const dep = await import(/* @vite-ignore */ String(${JSON.stringify(fileUrl.href)}));
                export default dep;
              `
            }
          },
        },
      ],
    }
  }

  test('dev', async () => {
    const server = await createServer(getConfig())
    onTestFinished(() => server.close())

    const runner = createServerModuleRunner(server.environments.ssr, {
      hmr: {
        logger: false,
      },
      sourcemapInterceptor: false,
    })

    const mod = await runner.import('/entry.js')
    expect(mod.default).toEqual('ok')

    const mod2 = await runner.import(fileUrl.href)
    expect(mod2).toBe(mod)

    const mod3 = await runner.import('virtual:test-dep/static')
    expect(mod3.default).toBe(mod)

    const mod4 = await runner.import('virtual:test-dep/non-static')
    expect(mod4.default).toBe(mod)
  })

  describe('environment builtins', () => {
    function getConfig(
      targetEnv: 'client' | 'ssr' | string,
      builtins: NonNullable<EnvironmentOptions['resolve']>['builtins'],
    ): InlineConfig {
      return {
        configFile: false,
        root: join(import.meta.dirname, 'fixtures/file-url'),
        logLevel: 'error',
        server: {
          middlewareMode: true,
        },
        environments: {
          [targetEnv]: {
            resolve: {
              builtins,
            },
          },
        },
      }
    }

    async function run({
      builtins,
      targetEnv = 'custom',
      testEnv = 'custom',
      idToResolve,
    }: {
      builtins?: NonNullable<EnvironmentOptions['resolve']>['builtins']
      targetEnv?: 'client' | 'ssr' | string
      testEnv?: 'client' | 'ssr' | string
      idToResolve: string
    }) {
      const server = await createServer(getConfig(targetEnv, builtins))
      onTestFinished(() => server.close())

      return server.environments[testEnv]?.pluginContainer.resolveId(
        idToResolve,
      )
    }

    test('declared builtin string', async () => {
      const resolved = await run({
        builtins: ['my-env:custom-builtin'],
        idToResolve: 'my-env:custom-builtin',
      })
      expect(resolved?.external).toBe(true)
    })

    test('declared builtin regexp', async () => {
      const resolved = await run({
        builtins: [/^my-env:\w/],
        idToResolve: 'my-env:custom-builtin',
      })
      expect(resolved?.external).toBe(true)
    })

    test('non declared builtin', async () => {
      const resolved = await run({
        builtins: [
          /* empty */
        ],
        idToResolve: 'my-env:custom-builtin',
      })
      expect(resolved).toBeNull()
    })

    test('non declared node builtin', async () => {
      await expect(
        run({
          builtins: [
            /* empty */
          ],
          idToResolve: 'node:fs',
        }),
      ).rejects.toThrowError(
        /Automatically externalized node built-in module "node:fs"/,
      )
    })

    test('default to node-like builtins', async () => {
      const resolved = await run({
        idToResolve: 'node:fs',
      })
      expect(resolved?.external).toBe(true)
    })

    test('default to node-like builtins for ssr environment', async () => {
      const resolved = await run({
        idToResolve: 'node:fs',
        testEnv: 'ssr',
      })
      expect(resolved?.external).toBe(true)
    })

    test('no default to node-like builtins for client environment', async () => {
      const resolved = await run({
        idToResolve: 'node:fs',
        testEnv: 'client',
      })
      expect(resolved?.id).toEqual('__vite-browser-external:node:fs')
    })

    test('no builtins overriding for client environment', async () => {
      const resolved = await run({
        idToResolve: 'node:fs',
        testEnv: 'client',
        targetEnv: 'client',
      })
      expect(resolved?.id).toEqual('__vite-browser-external:node:fs')
    })

    test('declared node builtin', async () => {
      const resolved = await run({
        builtins: [/^node:/],
        idToResolve: 'node:fs',
      })
      expect(resolved?.external).toBe(true)
    })

    test('declared builtin string in different environment', async () => {
      const resolved = await run({
        builtins: ['my-env:custom-builtin'],
        idToResolve: 'my-env:custom-builtin',
        targetEnv: 'custom',
        testEnv: 'ssr',
      })
      expect(resolved).toBe(null)
    })
  })

  test('build', async () => {
    await build({
      ...getConfig(),
      build: {
        ssr: true,
        outDir: 'dist/basic',
        rollupOptions: {
          input: { index: fileUrl.href },
        },
      },
    })
    const mod1 = await import(
      join(import.meta.dirname, 'fixtures/file-url/dist/basic/index.js')
    )
    expect(mod1.default).toBe('ok')

    await build({
      ...getConfig(),
      build: {
        ssr: true,
        outDir: 'dist/virtual',
        rollupOptions: {
          input: { index: 'virtual:test-dep/static' },
        },
      },
    })
    const mod2 = await import(
      join(import.meta.dirname, 'fixtures/file-url/dist/virtual/index.js')
    )
    expect(mod2.default.default).toBe('ok')
  })
})
