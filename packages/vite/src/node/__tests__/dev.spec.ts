import { afterEach, describe, expect, test } from 'vitest'
import type { ResolvedServerUrls } from 'vite'
import { createServer, resolveConfig } from '..'
import type { ViteDevServer } from '..'
import { promiseWithResolvers } from '../../shared/utils'

describe('resolveBuildEnvironmentOptions in dev', () => {
  test('build.rolldownOptions should not have input in lib', async () => {
    const config = await resolveConfig(
      {
        build: {
          lib: {
            entry: './index.js',
          },
        },
      },
      'serve',
    )

    expect(config.build.rolldownOptions).not.toHaveProperty('input')
  })
})

describe('top-level input option', () => {
  test('top-level input applies to the client environment only (non-inherit)', async () => {
    const config = await resolveConfig({ input: 'src/main.ts' }, 'serve')

    expect(config.input).toBe('src/main.ts')
    expect(config.environments.client.input).toBe('src/main.ts')
    expect(config.environments.ssr.input).toBeUndefined()
  })

  test('per-environment input overrides the top-level value', async () => {
    const config = await resolveConfig(
      {
        input: 'src/main.ts',
        environments: {
          ssr: { input: 'src/entry-server.ts' },
        },
      },
      'serve',
    )

    expect(config.environments.client.input).toBe('src/main.ts')
    expect(config.environments.ssr.input).toBe('src/entry-server.ts')
  })

  test('is used as the default for build.lib.entry when entry is omitted', async () => {
    const config = await resolveConfig(
      {
        input: 'src/lib.ts',
        build: { lib: { name: 'MyLib' } },
      },
      'build',
    )

    expect(config.build.lib && config.build.lib.entry).toBe('src/lib.ts')
    expect(
      config.environments.client.build.lib &&
        config.environments.client.build.lib.entry,
    ).toBe('src/lib.ts')
  })

  test('explicit build.lib.entry overrides the top-level input', async () => {
    const config = await resolveConfig(
      {
        input: 'src/lib.ts',
        build: { lib: { entry: 'src/explicit.ts', name: 'MyLib' } },
      },
      'build',
    )

    expect(config.build.lib && config.build.lib.entry).toBe('src/explicit.ts')
  })
})

describe('the dev server', () => {
  let server: ViteDevServer

  afterEach(async () => {
    await server?.close()
  })

  test('resolves the server URLs before the httpServer listening events are called', async () => {
    expect.assertions(1)

    const options = {
      port: 5013, // make sure the port is unique
    }

    const { promise, resolve } =
      promiseWithResolvers<ResolvedServerUrls | null>()
    server = await createServer({
      root: import.meta.dirname,
      logLevel: 'error',
      server: {
        strictPort: true,
        ws: false,
        ...options,
      },
      plugins: [
        {
          name: 'test',
          configureServer(server) {
            server.httpServer?.on('listening', () => {
              resolve(server.resolvedUrls)
            })
          },
        },
      ],
    })

    await server.listen()
    const urls = await promise

    expect(urls).toStrictEqual({
      local: ['http://localhost:5013/'],
      network: [],
    })
  })
})
