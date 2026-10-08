import path from 'node:path'
import type { ResolvedServerUrls } from 'vite'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { createServer, resolveConfig } from '..'
import type { ViteDevServer } from '..'
import { promiseWithResolvers } from '../../shared/utils'
import { createLogger } from '../logger'
import { _createServer } from '../server'
import { DevEnvironment } from '../server/environment'
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

  test('releases previous environments after initialization', async () => {
    const previousServer = await createServer({
      configFile: false,
      root: import.meta.dirname,
      optimizeDeps: { noDiscovery: true },
      server: { middlewareMode: true, ws: false },
    })
    const options = {
      listen: false,
      previousEnvironments: previousServer.environments,
    }

    try {
      const config = await resolveConfig(
        {
          configFile: false,
          root: import.meta.dirname,
          optimizeDeps: { noDiscovery: true },
          server: { middlewareMode: true, ws: false },
        },
        'serve',
      )
      const nextServer = await _createServer(config, options)

      expect(options.previousEnvironments).toBeUndefined()
      await nextServer.close()
    } finally {
      await previousServer.close()
    }
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

  test("logs watcher 'error' events during environment initialization", async () => {
    const error = new Error('watch failed')
    const logger = createLogger('error')
    logger.error = vi.fn()

    class WatcherErrorEnvironment extends DevEnvironment {
      override async init(
        options?: Parameters<DevEnvironment['init']>[0],
      ): Promise<void> {
        options?.watcher?.emit('error', error)
        await super.init(options)
      }
    }

    server = await createServer({
      configFile: false,
      root: import.meta.dirname,
      customLogger: logger,
      optimizeDeps: { noDiscovery: true },
      environments: {
        ssr: {
          dev: {
            createEnvironment: (name, config) =>
              new WatcherErrorEnvironment(name, config, { hot: false }),
          },
        },
      },
      server: { middlewareMode: true, ws: false },
    })

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('file watcher error: watch failed'),
    )
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

  // 1. Load config A.
  // 2. Start restart B and pause it.
  // 3. Queue three restart requests for config C.
  // 4. Complete restart B; one follow-up for C starts.
  // 5. Complete the follow-up for C.
  test('restarts again for a request made while a restart is in flight', async () => {
    let configVersion = 'A'
    const events: string[] = []
    const enteredB = promiseWithResolvers<void>()
    const releaseB = promiseWithResolvers<void>()
    const enteredC = promiseWithResolvers<void>()
    const releaseC = promiseWithResolvers<void>()

    server = await createServer({
      configFile: false,
      root: import.meta.dirname,
      logLevel: 'error',
      optimizeDeps: { noDiscovery: true },
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
            } else if (version === 'C') {
              enteredC.resolve()
              await releaseC.promise
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
    let settledCount = 0
    for (const restart of [restartB, ...restartsC]) {
      restart.then(() => {
        settledCount++
      })
    }

    releaseB.resolve()
    await enteredC.promise
    await Promise.resolve()
    // All callers wait for the queued follow-up restart to finish.
    expect(settledCount).toBe(0)

    releaseC.resolve()
    await Promise.all([restartB, ...restartsC])

    // The initial load and both restart passes each configure the server once.
    expect(events).toStrictEqual([
      'config:A',
      'server:A',
      'config:B',
      'server:B',
      'config:C',
      'server:C',
    ])
    // The initial caller and all three coalesced callers resolve together.
    expect(settledCount).toBe(4)
    // The user-facing server exposes the config loaded by the follow-up restart.
    expect(server.config.define!.__CONFIG_VERSION__).toBe('C')
  })

  // 1. Start the first restart and pause it.
  // 2. Queue the first follow-up.
  // 3. Complete the first restart; the first follow-up starts and pauses.
  // 4. Queue the second follow-up.
  // 5. Complete the first follow-up; the second follow-up completes.
  test('continues restarting when a request arrives during a follow-up', async () => {
    let configCalls = 0
    const enteredFirstRestart = promiseWithResolvers<void>()
    const releaseFirstRestart = promiseWithResolvers<void>()
    const enteredFollowUp = promiseWithResolvers<void>()
    const releaseFollowUp = promiseWithResolvers<void>()

    server = await createServer({
      configFile: false,
      root: import.meta.dirname,
      logLevel: 'error',
      optimizeDeps: { noDiscovery: true },
      server: { middlewareMode: true, ws: false },
      plugins: [
        {
          name: 'test',
          async config() {
            configCalls++
            if (configCalls === 2) {
              enteredFirstRestart.resolve()
              await releaseFirstRestart.promise
            } else if (configCalls === 3) {
              enteredFollowUp.resolve()
              await releaseFollowUp.promise
            }
          },
        },
      ],
    })

    const firstRestart = server.restart()
    await enteredFirstRestart.promise
    const firstFollowUp = server.restart()
    releaseFirstRestart.resolve()

    await enteredFollowUp.promise
    const secondFollowUp = server.restart()
    releaseFollowUp.resolve()
    await Promise.all([firstRestart, firstFollowUp, secondFollowUp])

    // The initial load, first restart, and two requested follow-ups all run.
    expect(configCalls).toBe(4)
  })

  // 1. Start a restart that initializes a temporary server.
  // 2. The temporary server's configureServer queues forced restart.
  // 3. The first restart completes.
  // 4. The forced follow-up completes.
  test('shares restart state with the server being initialized', async () => {
    let configureCalls = 0
    const forced: boolean[] = []

    server = await createServer({
      configFile: false,
      root: import.meta.dirname,
      logLevel: 'error',
      optimizeDeps: { noDiscovery: true },
      server: { middlewareMode: true, ws: false },
      plugins: [
        {
          name: 'test',
          configureServer(server) {
            configureCalls++
            forced.push(server.config.environments.client.optimizeDeps.force!)
            if (configureCalls === 2) {
              void server.restart(true)
            }
          },
        },
      ],
    })

    await server.restart()

    // The temporary server requests one follow-up during the first restart.
    expect(configureCalls).toBe(3)
    // Only that follow-up observes the temporary server's restart(true) request.
    expect(forced).toStrictEqual([false, false, true])
  })

  // 1. Start the first restart and pause it in configureServer.
  // 2. Queue forced restart.
  // 3. Complete the first restart.
  // 4. The forced follow-up completes.
  test('keeps forceOptimize from a restart requested while a restart is in flight', async () => {
    const forced: boolean[] = []
    const enteredRestart = promiseWithResolvers<void>()
    const releaseRestart = promiseWithResolvers<void>()

    server = await createServer({
      configFile: false,
      root: import.meta.dirname,
      logLevel: 'error',
      optimizeDeps: { noDiscovery: true },
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

    // The queued restart(true) forces only the follow-up restart.
    expect(forced).toStrictEqual([false, false, true])
    // The user-facing server retains the config from the forced follow-up.
    expect(server.config.environments.client.optimizeDeps.force).toBe(true)
  })
})
