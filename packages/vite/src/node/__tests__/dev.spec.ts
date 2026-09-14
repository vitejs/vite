import path from 'node:path'
import type { ResolvedServerUrls } from 'vite'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { createServer, resolveConfig } from '..'
import type { ViteDevServer } from '..'
import { promiseWithResolvers } from '../../shared/utils'
import { createLogger } from '../logger'
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

  test('resolves each environment input as a safe module', async () => {
    const root = path.join(import.meta.dirname, 'fixtures', 'input-option')
    const clientEntry = normalizePath(path.join(root, 'client-entry.js'))
    const ssrEntry = normalizePath(path.join(root, 'ssr-entry.js'))

    server = await createServer({
      configFile: false,
      root,
      input: 'virtual:client-entry',
      environments: {
        ssr: { input: { main: 'virtual:ssr-entry' } },
      },
      optimizeDeps: { noDiscovery: true },
      server: { fs: { allow: [] }, middlewareMode: true, ws: false },
      plugins: [
        {
          name: 'resolve-environment-entries',
          resolveId(id) {
            if (id === `virtual:${this.environment.name}-entry`) {
              return this.environment.name === 'client' ? clientEntry : ssrEntry
            }
          },
        },
      ],
    })

    expect(server.config.safeModulePaths).toStrictEqual(new Set([clientEntry]))
    await server.environments.ssr.pluginContainer.buildStart()
    expect(server.config.safeModulePaths).toStrictEqual(
      new Set([clientEntry, ssrEntry]),
    )
  })

  test('does not mark an external environment input as safe', async () => {
    const root = path.join(import.meta.dirname, 'fixtures', 'input-option')
    const externalEntry = normalizePath(path.join(root, 'external-entry.js'))

    server = await createServer({
      configFile: false,
      root,
      input: 'virtual:external-entry',
      optimizeDeps: { noDiscovery: true },
      server: { fs: { allow: [] }, middlewareMode: true, ws: false },
      plugins: [
        {
          name: 'external-environment-entry',
          resolveId(id) {
            if (id === 'virtual:external-entry') {
              return { id: externalEntry, external: true }
            }
          },
        },
      ],
    })

    expect(server.config.safeModulePaths).not.toContain(externalEntry)
  })

  test('silently resolves index.html as the fallback for every environment', async () => {
    const root = path.join(import.meta.dirname, 'fixtures', 'input-option')
    const clientEntry = normalizePath(path.join(root, 'client-index.html'))
    const resolvedEnvironments = new Set<string>()
    const logger = createLogger('silent')
    logger.warn = vi.fn()

    server = await createServer({
      configFile: false,
      root,
      customLogger: logger,
      optimizeDeps: { noDiscovery: true },
      server: { fs: { allow: [] }, middlewareMode: true, ws: false },
      plugins: [
        {
          name: 'resolve-environment-index',
          resolveId(id) {
            if (id !== 'index.html') return
            resolvedEnvironments.add(this.environment.name)
            if (this.environment.name === 'ssr') {
              throw new Error('ssr does not have an HTML entry')
            }
            return clientEntry
          },
        },
      ],
    })

    expect(resolvedEnvironments).toStrictEqual(new Set(['client']))
    await server.environments.ssr.pluginContainer.buildStart()
    expect(resolvedEnvironments).toStrictEqual(new Set(['client', 'ssr']))
    expect(server.config.safeModulePaths).toStrictEqual(new Set([clientEntry]))
    expect(logger.warn).not.toHaveBeenCalled()
  })

  test('does not ignore buildStart errors while resolving fallback inputs', async () => {
    server = await createServer({
      configFile: false,
      root: path.join(import.meta.dirname, 'fixtures', 'input-option'),
      logLevel: 'silent',
      optimizeDeps: { noDiscovery: true },
      plugins: [
        {
          name: 'failing-build-start',
          perEnvironmentStartEndDuringDev: true,
          buildStart() {
            if (this.environment.name === 'ssr') {
              throw new Error('buildStart failed')
            }
          },
        },
      ],
      server: {
        fs: { allow: [] },
        middlewareMode: true,
        watch: null,
        ws: false,
      },
    })

    await expect(
      server.environments.ssr.pluginContainer.buildStart(),
    ).rejects.toThrow('buildStart failed')
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
      networkInterfaceNames: [],
    })
  })

  test('restarts again for a request made while a restart is in flight', async () => {
    let configVersion = 'A'
    const events: string[] = []
    const enteredB = promiseWithResolvers<void>()
    const releaseB = promiseWithResolvers<void>()

    server = await createServer({
      configFile: false,
      root: import.meta.dirname,
      logLevel: 'error',
      server: { middlewareMode: true, ws: false },
      plugins: [
        {
          name: 'test',
          async config() {
            const version = configVersion
            events.push(`config:${version}`)
            if (version === 'B') {
              enteredB.resolve()
              await releaseB.promise
            }
            return { define: { __CONFIG_VERSION__: version } }
          },
          configureServer(server) {
            events.push(`server:${server.config.define!.__CONFIG_VERSION__}`)
          },
        },
      ],
    })

    configVersion = 'B'
    const restartB = server.restart()
    await enteredB.promise

    configVersion = 'C'
    const restartsC = [server.restart(), server.restart(), server.restart()]
    releaseB.resolve()
    await Promise.all([restartB, ...restartsC])

    expect(events).toStrictEqual([
      'config:A',
      'server:A',
      'config:B',
      'server:B',
      'config:C',
      'server:C',
    ])
    expect(server.config.define!.__CONFIG_VERSION__).toBe('C')
  })

  test('keeps forceOptimize from a restart requested while a restart is in flight', async () => {
    const forced: boolean[] = []
    const enteredRestart = promiseWithResolvers<void>()
    const releaseRestart = promiseWithResolvers<void>()

    server = await createServer({
      configFile: false,
      root: import.meta.dirname,
      logLevel: 'error',
      server: { middlewareMode: true, ws: false },
      plugins: [
        {
          name: 'test',
          async configureServer(server) {
            forced.push(server.config.environments.client.optimizeDeps.force!)
            if (forced.length === 2) {
              enteredRestart.resolve()
              await releaseRestart.promise
            }
          },
        },
      ],
    })

    const first = server.restart()
    await enteredRestart.promise
    const second = server.restart(true)
    releaseRestart.resolve()
    await Promise.all([first, second])

    expect(forced).toStrictEqual([false, false, true])
    expect(server.config.environments.client.optimizeDeps.force).toBe(true)
  })
})
