import path from 'node:path'
import type { ResolvedServerUrls } from 'vite'
import { describe, expect, test, vi } from 'vitest'
import { createServer, resolveConfig } from '..'
import { promiseWithResolvers } from '../../shared/utils'
import { createLogger } from '../logger'
import { _createServer } from '../server'
import { DevEnvironment } from '../server/environment'
import {
  isFileLoadingAllowed,
  isFileServingAllowed,
} from '../server/middlewares/static'
import { normalizePath } from '../utils'
import { createTestServer } from './testUtils'

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

  test('aliases config.safeModulePaths to the client safe module paths across restarts', async () => {
    const server = await createTestServer({
      configFile: false,
      root: import.meta.dirname,
      logLevel: 'silent',
      optimizeDeps: { noDiscovery: true },
      server: { middlewareMode: true, ws: false },
    })

    expect(server.config.safeModulePaths).toBe(
      server.environments.client.safeModulePaths,
    )
    server.config.safeModulePaths.add('/client-plugin-entry.js')
    expect(server.environments.client.safeModulePaths).toContain(
      '/client-plugin-entry.js',
    )
    expect(server.environments.ssr.safeModulePaths).not.toContain(
      '/client-plugin-entry.js',
    )

    await server.restart()

    expect(server.config.safeModulePaths).toBe(
      server.environments.client.safeModulePaths,
    )
  })

  test('applies server.fs.allow and deny to every environment', async () => {
    const root = normalizePath(
      path.join(import.meta.dirname, 'fixtures', 'input-option'),
    )
    const allowedFile = path.posix.join(root, 'entry.js')
    const deniedFile = path.posix.join(root, 'private.txt')
    const outsideFile = path.posix.join(root, '../outside.js')

    const server = await createTestServer({
      configFile: false,
      root,
      environments: { custom: {} },
      optimizeDeps: { noDiscovery: true },
      server: {
        fs: { strict: true, allow: [root], deny: ['**/private.txt'] },
        middlewareMode: true,
        ws: false,
      },
    })

    for (const environment of Object.values(server.environments)) {
      expect(
        isFileLoadingAllowed(environment.config, allowedFile),
        environment.name,
      ).toBe(true)
      expect(
        isFileLoadingAllowed(environment.config, outsideFile),
        environment.name,
      ).toBe(false)
      environment.addSafeModule(deniedFile)
      expect(
        isFileLoadingAllowed(environment.config, deniedFile),
        environment.name,
      ).toBe(false)
    }
  })

  test('registers a safe module in the current environment when a transform adds its reference', async () => {
    const root = path.join(import.meta.dirname, 'fixtures', 'input-option')
    const runtimeFile = normalizePath(path.join(root, 'plugin-runtime.js'))
    const runtimeId = runtimeFile + '?custom'
    const runtimeUrl = path.posix.join('/@custom/', runtimeId)
    const callInLoad = vi.fn()

    const server = await createTestServer({
      configFile: false,
      root,
      logLevel: 'silent',
      optimizeDeps: { noDiscovery: true },
      server: {
        fs: { strict: 'extended', allow: [] },
        middlewareMode: true,
        ws: false,
      },
      plugins: [
        {
          name: 'plugin-runtime',
          resolveId(source) {
            if (source === 'virtual:entry') return '\0entry'
            if (source === runtimeUrl) return runtimeId
          },
          load(id) {
            callInLoad()
            if (id === '\0entry') return ''
            if (id === runtimeId) return 'export default 42'
          },
          transform(_code, id) {
            if (id !== '\0entry') return
            if (this.environment.mode === 'dev') {
              this.environment.addSafeModule(runtimeId)
            }
            return `export const runtimeUrl = ${JSON.stringify(runtimeUrl)}`
          },
        },
      ],
    })

    const { client, ssr } = server.environments
    await ssr.pluginContainer.resolveId(runtimeUrl)
    expect(isFileLoadingAllowed(ssr.config, runtimeId)).toBe(false)
    expect((await ssr.transformRequest('virtual:entry'))?.code).toContain(
      runtimeUrl,
    )
    expect(isFileLoadingAllowed(ssr.config, runtimeId)).toBe(true)
    expect(isFileLoadingAllowed(ssr.config, runtimeFile)).toBe(true)
    expect(isFileLoadingAllowed(ssr.config, runtimeFile + '?other')).toBe(false)
    expect(isFileLoadingAllowed(client.config, runtimeId)).toBe(false)
    expect(isFileLoadingAllowed(client.config, runtimeFile)).toBe(false)
    expect(await ssr.transformRequest(runtimeUrl)).not.toBeNull()

    callInLoad.mockClear()
    await expect(client.transformRequest(runtimeUrl)).rejects.toMatchObject({
      code: 'ERR_DENIED_ID',
    })
    expect(callInLoad).not.toHaveBeenCalled()
  })

  test('resolves environment inputs into separate safe module paths', async () => {
    const root = path.join(import.meta.dirname, 'fixtures', 'input-option')
    const entries: Record<string, string> = {
      client: normalizePath(path.join(root, 'client-entry.js')),
      ssr: normalizePath(path.join(root, 'ssr-entry.js')),
      custom: normalizePath(path.join(root, 'custom-entry.js')),
    }

    const server = await createTestServer({
      configFile: false,
      root,
      input: 'virtual:client-entry',
      environments: {
        ssr: { input: { main: 'virtual:ssr-entry' } },
        custom: { input: 'virtual:custom-entry' },
      },
      optimizeDeps: { noDiscovery: true },
      server: { fs: { allow: [] }, middlewareMode: true, ws: false },
      plugins: [
        {
          name: 'resolve-environment-entries',
          resolveId(id) {
            if (id === `virtual:${this.environment.name}-entry`) {
              return entries[this.environment.name]
            }
          },
        },
      ],
    })

    await Promise.all(
      Object.values(server.environments).map((environment) =>
        environment.pluginContainer.buildStart(),
      ),
    )
    for (const environment of Object.values(server.environments)) {
      expect(
        new Set(environment.safeModulePaths),
        environment.name,
      ).toStrictEqual(new Set([entries[environment.name]]))
      for (const [name, entry] of Object.entries(entries)) {
        expect(
          isFileLoadingAllowed(environment.config, entry),
          `${environment.name}: ${name}`,
        ).toBe(name === environment.name)
      }
    }
  })

  test('keeps SSR imports out of the client safe module paths', async () => {
    const root = path.join(import.meta.dirname, 'fixtures', 'input-option')
    const importedFile = normalizePath(path.join(root, 'entry.js'))
    const importedId = importedFile + '?raw'
    const importedUrl = path.posix.join('/@fs/', importedId)

    const server = await createTestServer({
      configFile: false,
      root,
      logLevel: 'silent',
      environments: {
        ssr: { input: 'virtual:ssr-entry' },
      },
      optimizeDeps: { noDiscovery: true },
      server: {
        fs: { strict: 'extended', allow: [] },
        host: '127.0.0.1',
        port: 0,
        ws: false,
      },
      plugins: [
        {
          name: 'ssr-entry',
          resolveId(id) {
            if (id === 'virtual:ssr-entry') return '\0ssr-entry'
          },
          load(id) {
            if (id === '\0ssr-entry') {
              return `import ${JSON.stringify(importedUrl)}`
            }
          },
        },
      ],
    })

    const { client, ssr } = server.environments
    await ssr.transformRequest('virtual:ssr-entry')
    expect(ssr.safeModulePaths).toContain(importedId)
    expect(client.safeModulePaths).not.toContain(importedId)
    expect(isFileLoadingAllowed(ssr.config, importedFile)).toBe(true)
    expect(isFileLoadingAllowed(client.config, importedFile)).toBe(false)
    expect(isFileServingAllowed(importedUrl, server)).toBe(false)
    expect(isFileServingAllowed(server.config, importedUrl)).toBe(false)
    expect(isFileServingAllowed(ssr.config, importedUrl)).toBe(true)
    expect(isFileServingAllowed(client.config, importedUrl)).toBe(false)
    expect((await ssr.transformRequest(importedUrl))?.code).toContain(
      'export default',
    )
    await expect(client.transformRequest(importedUrl)).rejects.toMatchObject({
      code: 'ERR_DENIED_ID',
    })

    await server.listen()
    const baseUrl = server.resolvedUrls!.local[0]
    for (const url of [
      importedUrl,
      path.posix.join('/@fs/', importedFile),
      '/entry.js',
    ]) {
      expect((await fetch(new URL(url, baseUrl))).status).toBe(403)
    }

    await server.transformIndexHtml(
      '/index.html',
      `<script type="module" src="${importedUrl}"></script>`,
    )
    expect(isFileServingAllowed(importedUrl, server)).toBe(true)
    expect(isFileServingAllowed(server.config, importedUrl)).toBe(true)
    expect(isFileServingAllowed(client.config, importedUrl)).toBe(true)
    expect((await fetch(new URL(importedUrl, baseUrl))).status).toBe(200)
  })

  test('serves asset URLs emitted by SSR outside the filesystem allow list', async () => {
    const root = path.join(import.meta.dirname, 'fixtures', 'input-option')
    const assetFile = normalizePath(
      path.join(root, '../public-dir-write-false/public/favicon.svg'),
    )
    const assetId = assetFile + '?no-inline'
    const assetUrl = path.posix.join('/@fs/', assetId)

    const server = await createTestServer({
      configFile: false,
      root,
      logLevel: 'silent',
      environments: { ssr: { input: 'virtual:ssr-entry' } },
      optimizeDeps: { noDiscovery: true },
      server: {
        fs: { allow: [root] },
        host: '127.0.0.1',
        port: 0,
        ws: false,
      },
      plugins: [
        {
          name: 'ssr-asset-entry',
          resolveId(id) {
            if (id === 'virtual:ssr-entry') return '\0ssr-entry'
          },
          load(id) {
            if (id === '\0ssr-entry')
              return `import ${JSON.stringify(assetUrl)}`
          },
        },
      ],
    })

    const { client, ssr } = server.environments
    await ssr.transformRequest('virtual:ssr-entry')
    expect(client.safeModulePaths).not.toContain(assetFile)
    expect((await ssr.transformRequest(assetUrl))?.code).toContain(assetUrl)
    expect(client.safeModulePaths).toContain(assetFile)

    await server.listen()
    const response = await fetch(
      new URL(assetUrl, server.resolvedUrls!.local[0]),
    )
    expect(response.status).toBe(200)
    expect(await response.text()).toContain('<svg')
  })

  test('does not mark an external environment input as safe', async () => {
    const root = path.join(import.meta.dirname, 'fixtures', 'input-option')
    const externalEntry = normalizePath(path.join(root, 'external-entry.js'))

    const server = await createTestServer({
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

    expect(server.environments.client.safeModulePaths).not.toContain(
      externalEntry,
    )
  })

  test('does not mark unresolved SSR imports as safe', async () => {
    const root = path.join(import.meta.dirname, 'fixtures', 'input-option')
    const entry = normalizePath(path.join(root, 'unresolved-entry.js'))
    const unresolvedImport = '/safe-module-path-unresolved'

    const server = await createTestServer({
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

    expect(server.environments.ssr.safeModulePaths).not.toContain(
      unresolvedImport,
    )
  })

  test('silently resolves index.html as the fallback for every environment', async () => {
    const root = path.join(import.meta.dirname, 'fixtures', 'input-option')
    const clientEntry = normalizePath(path.join(root, 'client-index.html'))
    const resolvedEnvironments = new Set<string>()
    const logger = createLogger('silent')
    vi.spyOn(logger, 'warn').mockImplementation(() => {})

    const server = await createTestServer({
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
    expect(new Set(server.environments.client.safeModulePaths)).toStrictEqual(
      new Set([clientEntry]),
    )
    expect(logger.warn).not.toHaveBeenCalled()
  })

  test('does not ignore buildStart errors while resolving fallback inputs', async () => {
    const server = await createTestServer({
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
    vi.spyOn(logger, 'error').mockImplementation(() => {})

    class WatcherErrorEnvironment extends DevEnvironment {
      override async init(
        options?: Parameters<DevEnvironment['init']>[0],
      ): Promise<void> {
        options?.watcher?.emit('error', error)
        await super.init(options)
      }
    }

    await createTestServer({
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
    const server = await createTestServer({
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

    const server = await createTestServer({
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

    const server = await createTestServer({
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

    const server = await createTestServer({
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

    const server = await createTestServer({
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
