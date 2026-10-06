import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import type { ResolvedServerUrls } from 'vite'
import { createServer, resolveConfig } from '..'
import type { ViteDevServer } from '..'
import { promiseWithResolvers } from '../../shared/utils'
import { normalizePath } from '../utils'

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

describe('the dev server', () => {
  let server: ViteDevServer

  afterEach(async () => {
    await server?.close()
  })

  test('does not mark unresolved SSR imports as safe', async () => {
    const root = path.join(import.meta.dirname, 'fixtures', 'input-option')
    const entry = normalizePath(path.join(root, 'unresolved-entry.js'))
    const unresolvedImport = '/safe-module-path-unresolved'

    server = await createServer({
      configFile: false,
      root,
      optimizeDeps: { noDiscovery: true },
      server: { middlewareMode: true, ws: false },
      plugins: [
        {
          name: 'unresolved-ssr-import',
          resolveId(id) {
            if (id === '/unresolved-entry.js') return entry
          },
          load(id) {
            if (id === entry)
              return `import ${JSON.stringify(unresolvedImport)}`
          },
        },
      ],
    })

    await server.environments.ssr.transformRequest('/unresolved-entry.js')

    expect(server.config.safeModulePaths).not.toContain(unresolvedImport)
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
      // `server.listen()` would otherwise start a dep scan that crawls every
      // HTML fixture under `__tests__`
      optimizeDeps: {
        noDiscovery: true,
        include: [],
      },
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
