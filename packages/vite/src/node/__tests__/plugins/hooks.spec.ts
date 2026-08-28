import path from 'node:path'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { promiseWithResolvers } from '../../../shared/utils'
import { build } from '../../build'
import { resolveConfig } from '../../config'
import { type Logger, createLogger } from '../../logger'
import type { Plugin } from '../../plugin'
import { preview } from '../../preview'
import { createServer } from '../../server'

const resolveConfigWithPlugin = (
  plugin: Plugin,
  command: 'serve' | 'build' = 'serve',
) => {
  return resolveConfig(
    { configFile: false, plugins: [plugin], logLevel: 'error' },
    command,
  )
}

const ENTRY_ID = 'entry.js'
const RESOLVED_ENTRY_ID = `\0${ENTRY_ID}`
const resolveEntryPlugin: Plugin = {
  name: 'resolve-entry.js',
  resolveId(id) {
    if (id === ENTRY_ID) {
      return RESOLVED_ENTRY_ID
    }
  },
  load(id) {
    if (id === RESOLVED_ENTRY_ID) {
      return 'export default {}'
    }
  },
}

const createServerWithPlugin = async (
  plugin: Plugin,
  customLogger?: Logger,
) => {
  const server = await createServer({
    configFile: false,
    root: import.meta.dirname,
    plugins: [plugin, resolveEntryPlugin],
    logLevel: 'error',
    customLogger,
    server: {
      middlewareMode: true,
      ws: false,
    },
  })
  onTestFinished(() => server.close())
  return server
}

const createPreviewServerWithPlugin = async (plugin: Plugin) => {
  const server = await preview({
    configFile: false,
    root: import.meta.dirname,
    plugins: [
      {
        name: 'mock-preview',
        configurePreviewServer({ httpServer }) {
          // NOTE: make httpServer.listen no-op to avoid starting a server
          httpServer.listen = () => {
            const lastListener = httpServer.listeners('listening').at(-1)!
            lastListener.call(httpServer)
            return httpServer as any
          }
        },
      },
      plugin,
    ],
    logLevel: 'error',
  })
  onTestFinished(() => server.close())
  return server
}

const buildWithPlugin = async (plugin: Plugin) => {
  await build({
    root: path.resolve(import.meta.dirname, '../packages/build-project'),
    logLevel: 'error',
    build: {
      write: false,
    },
    plugins: [plugin, resolveEntryPlugin],
  })
}

describe('supports plugin context', () => {
  test('config hook', async () => {
    expect.assertions(4)

    await resolveConfigWithPlugin({
      name: 'test',
      config() {
        expect(this).toMatchObject({
          debug: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
          error: expect.any(Function),
          meta: expect.any(Object),
        })
        expect(this.meta.rollupVersion).toBeTypeOf('string')
        expect(this.meta.viteVersion).toBeTypeOf('string')
        // @ts-expect-error watchMode should not exist in types
        expect(this.meta.watchMode).toBeUndefined()
      },
    })
  })

  test('configEnvironment hook', async () => {
    expect.assertions(4)

    await resolveConfigWithPlugin({
      name: 'test',
      configEnvironment(name) {
        if (name !== 'client') return

        expect(this).toMatchObject({
          debug: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
          error: expect.any(Function),
          meta: expect.any(Object),
        })
        expect(this.meta.rollupVersion).toBeTypeOf('string')
        expect(this.meta.viteVersion).toBeTypeOf('string')
        // @ts-expect-error watchMode should not exist in types
        expect(this.meta.watchMode).toBeUndefined()
      },
    })
  })

  test('configResolved hook', async () => {
    expect.assertions(4)

    await resolveConfigWithPlugin({
      name: 'test',
      configResolved() {
        expect(this).toMatchObject({
          debug: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
          error: expect.any(Function),
          meta: expect.any(Object),
        })
        expect(this.meta.rollupVersion).toBeTypeOf('string')
        expect(this.meta.viteVersion).toBeTypeOf('string')
        expect(this.meta.watchMode).toBe(true)
      },
    })
  })

  test('configureServer hook', async () => {
    expect.assertions(4)

    await createServerWithPlugin({
      name: 'test',
      configureServer() {
        expect(this).toMatchObject({
          debug: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
          error: expect.any(Function),
          meta: expect.any(Object),
        })
        expect(this.meta.rollupVersion).toBeTypeOf('string')
        expect(this.meta.viteVersion).toBeTypeOf('string')
        expect(this.meta.watchMode).toBe(true)
      },
    })
  })

  test('configurePreviewServer hook', async () => {
    expect.assertions(4)

    await createPreviewServerWithPlugin({
      name: 'test',
      configurePreviewServer() {
        expect(this).toMatchObject({
          debug: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
          error: expect.any(Function),
          meta: expect.any(Object),
        })
        expect(this.meta.rollupVersion).toBeTypeOf('string')
        expect(this.meta.viteVersion).toBeTypeOf('string')
        expect(this.meta.watchMode).toBe(false)
      },
    })
  })

  test('transformIndexHtml hook in dev', async () => {
    expect.assertions(4)

    const server = await createServerWithPlugin({
      name: 'test',
      transformIndexHtml() {
        expect(this).toMatchObject({
          debug: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
          error: expect.any(Function),
          meta: expect.any(Object),
        })
        expect(this.meta.rollupVersion).toBeTypeOf('string')
        expect(this.meta.viteVersion).toBeTypeOf('string')
        expect(this.meta.watchMode).toBe(true)
      },
    })
    await server.transformIndexHtml('/index.html', '<html></html>')
  })

  test('transformIndexHtml hook in build', async () => {
    expect.assertions(4)

    await buildWithPlugin({
      name: 'test',
      transformIndexHtml() {
        expect(this).toMatchObject({
          debug: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
          error: expect.any(Function),
          meta: expect.any(Object),
        })
        expect(this.meta.rollupVersion).toBeTypeOf('string')
        expect(this.meta.viteVersion).toBeTypeOf('string')
        expect(this.meta.watchMode).toBe(false)
      },
    })
  })

  test('handleHotUpdate hook', async () => {
    expect.assertions(4)

    const { promise, resolve } = promiseWithResolvers<void>()
    const server = await createServerWithPlugin({
      name: 'test',
      handleHotUpdate() {
        expect(this).toMatchObject({
          debug: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
          error: expect.any(Function),
          meta: expect.any(Object),
        })
        expect(this.meta.rollupVersion).toBeTypeOf('string')
        expect(this.meta.viteVersion).toBeTypeOf('string')
        expect(this.meta.watchMode).toBe(true)
        resolve()
      },
    })
    server.watcher.emit(
      'change',
      path.resolve(import.meta.dirname, 'index.html'),
    )

    await promise
  })

  test('hotUpdate hook', async () => {
    expect.assertions(4)

    const { promise, resolve } = promiseWithResolvers<void>()
    const server = await createServerWithPlugin({
      name: 'test',
      hotUpdate() {
        if (this.environment.name !== 'client') return

        expect(this).toMatchObject({
          debug: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
          error: expect.any(Function),
          meta: expect.any(Object),
          environment: expect.any(Object),
        })
        expect(this.meta.rollupVersion).toBeTypeOf('string')
        expect(this.meta.viteVersion).toBeTypeOf('string')
        expect(this.meta.watchMode).toBe(true)
        resolve()
      },
    })
    server.watcher.emit(
      'change',
      path.resolve(import.meta.dirname, 'index.html'),
    )

    await promise
  })

  test('transform hook in dev', async () => {
    expect.assertions(4)

    const server = await createServerWithPlugin({
      name: 'test',
      transform(_code, id) {
        if (id !== RESOLVED_ENTRY_ID) return
        expect(this).toMatchObject({
          debug: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
          error: expect.any(Function),
          meta: expect.any(Object),
        })
        expect(this.meta.rollupVersion).toBeTypeOf('string')
        expect(this.meta.viteVersion).toBeTypeOf('string')
        expect(this.meta.watchMode).toBe(true)
      },
    })
    await server.transformRequest(ENTRY_ID)
    await server.close()
  })

  test('transform hook in build', async () => {
    expect.assertions(4)

    await buildWithPlugin({
      name: 'test',
      transform(_code, id) {
        if (id !== RESOLVED_ENTRY_ID) return
        expect(this).toMatchObject({
          debug: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
          error: expect.any(Function),
          meta: expect.any(Object),
        })
        expect(this.meta.rollupVersion).toBeTypeOf('string')
        expect(this.meta.viteVersion).toBeTypeOf('string')
        expect(this.meta.watchMode).toBe(false)
      },
    })
  })

  test('this.fs is supported in dev', async () => {
    expect.hasAssertions()

    const server = await createServerWithPlugin({
      name: 'test',
      resolveId(id) {
        if (id !== ENTRY_ID) return
        expect(this.fs.readFile).toBeTypeOf('function')
      },
    })
    await server.transformRequest(ENTRY_ID)
    await server.close()
  })
})

describe('watcher add/unlink error handling', () => {
  test("'add' event logs error when watchChange throws", async () => {
    const { promise, resolve } = promiseWithResolvers<void>()
    const error = new Error('async watchChange error')

    const logError = vi.fn()
    const logger = createLogger('error')
    logger.error = (...args) => {
      logError(...args)
      resolve()
    }

    const server = await createServerWithPlugin(
      {
        name: 'test',
        watchChange() {
          return Promise.reject(error)
        },
      },
      logger,
    )

    server.watcher.emit(
      'add',
      path.resolve(import.meta.dirname, 'some-file.js'),
    )

    await promise
    expect(logError).toHaveBeenCalled()
    expect(logError).toHaveBeenCalledWith(error)
  })

  test("'change' event logs error when watchChange throws", async () => {
    const { promise, resolve } = promiseWithResolvers<void>()
    const error = new Error('async watchChange error')

    const logError = vi.fn()
    const logger = createLogger('error')
    logger.error = (...args) => {
      logError(...args)
      resolve()
    }

    const server = await createServerWithPlugin(
      {
        name: 'test',
        watchChange() {
          return Promise.reject(error)
        },
      },
      logger,
    )

    server.watcher.emit(
      'change',
      path.resolve(import.meta.dirname, 'some-file.js'),
    )

    await promise
    expect(logError).toHaveBeenCalled()
    expect(logError).toHaveBeenCalledWith(error)
  })

  test("'unlink' event logs error when watchChange throws", async () => {
    const { promise, resolve } = promiseWithResolvers<void>()
    const error = new Error('async watchChange error')

    const logError = vi.fn()
    const logger = createLogger('error')
    logger.error = (...args) => {
      logError(...args)
      resolve()
    }

    const server = await createServerWithPlugin(
      {
        name: 'test',
        watchChange() {
          return Promise.reject(error)
        },
      },
      logger,
    )

    server.watcher.emit(
      'unlink',
      path.resolve(import.meta.dirname, 'some-file.js'),
    )

    await promise
    expect(logError).toHaveBeenCalled()
    expect(logError).toHaveBeenCalledWith(error)
  })
})

describe('closeServer hook', () => {
  test('is called with reason "close" on server.close()', async () => {
    const closeServer = vi.fn()
    const server = await createServerWithPlugin({
      name: 'test',
      closeServer,
    })

    await server.close()

    expect(closeServer).toHaveBeenCalledTimes(1)
    expect(closeServer).toHaveBeenCalledWith({ reason: 'close' })
  })

  test('receives a minimal plugin context as `this`', async () => {
    expect.assertions(2)

    const server = await createServerWithPlugin({
      name: 'test',
      closeServer() {
        expect(this).toMatchObject({
          debug: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
          error: expect.any(Function),
          meta: expect.any(Object),
        })
        // Global hooks don't have an environment.
        expect(this).not.toHaveProperty('environment')
      },
    })

    await server.close()
  })

  test('is awaited before server.close() resolves', async () => {
    let hookDone = false
    const server = await createServerWithPlugin({
      name: 'test',
      async closeServer() {
        await new Promise((r) => setTimeout(r, 10))
        hookDone = true
      },
    })

    await server.close()

    // `server.close()` does not resolve until the async hook has completed.
    expect(hookDone).toBe(true)
  })

  test('runs after the server is torn down (after closeBundle)', async () => {
    const order: string[] = []
    const server = await createServerWithPlugin({
      name: 'test',
      closeBundle() {
        order.push('closeBundle')
      },
      closeServer() {
        order.push('closeServer')
      },
    })

    await server.close()

    // `closeBundle` runs as part of teardown (once per environment); the
    // `closeServer` hook runs afterwards, so it is the last event.
    expect(order.at(-1)).toBe('closeServer')
    expect(order.indexOf('closeBundle')).toBeLessThan(
      order.indexOf('closeServer'),
    )
  })

  test('runs hooks in parallel', async () => {
    const events: string[] = []
    const server = await createServer({
      configFile: false,
      root: import.meta.dirname,
      plugins: [
        {
          name: 'a',
          async closeServer() {
            events.push('a:start')
            await new Promise((r) => setTimeout(r, 20))
            events.push('a:end')
          },
        },
        {
          name: 'b',
          async closeServer() {
            events.push('b:start')
            await new Promise((r) => setTimeout(r, 20))
            events.push('b:end')
          },
        },
        resolveEntryPlugin,
      ],
      logLevel: 'error',
      server: { middlewareMode: true, ws: false },
    })

    await server.close()

    // Both hooks start before either finishes.
    expect(events.slice(0, 2)).toStrictEqual(['a:start', 'b:start'])
  })

  test('is called only once even if close() is called multiple times', async () => {
    const closeServer = vi.fn()
    const server = await createServerWithPlugin({
      name: 'test',
      closeServer,
    })

    await Promise.all([server.close(), server.close()])
    await server.close()

    expect(closeServer).toHaveBeenCalledTimes(1)
  })

  test('is called with reason "restart" on server.restart()', async () => {
    const closeServer = vi.fn()
    const server = await createServerWithPlugin({
      name: 'test',
      closeServer,
    })

    await server.restart()

    expect(closeServer).toHaveBeenCalledTimes(1)
    expect(closeServer).toHaveBeenCalledWith({ reason: 'restart' })

    await server.close()
  })

  test('queues and runs follow-up restart if requested while restart is in flight', async () => {
    let restartCount = 0
    const server = await createServerWithPlugin({
      name: 'test-restart-race',
      async config() {
        restartCount++
        // simulate slow plugin startup to ensure race window
        await new Promise((r) => setTimeout(r, 50))
      },
    })

    // restartCount is 1 from initial createServer
    expect(restartCount).toBe(1)

    // Trigger restart 1
    const p1 = server.restart()
    // Trigger restart 2 while restart 1 is in flight
    const p2 = server.restart()

    await Promise.all([p1, p2])

    // restartCount should be 3: 1 (init) + 1 (first restart) + 1 (follow-up restart)
    expect(restartCount).toBe(3)

    await server.close()
  })
})

describe('closePreviewServer hook', () => {
  test('is called on preview server.close()', async () => {
    const closePreviewServer = vi.fn()
    const server = await createPreviewServerWithPlugin({
      name: 'test',
      closePreviewServer,
    })

    await server.close()

    expect(closePreviewServer).toHaveBeenCalledTimes(1)
  })

  test('is awaited before server.close() resolves', async () => {
    let hookDone = false
    const server = await createPreviewServerWithPlugin({
      name: 'test',
      async closePreviewServer() {
        await new Promise((r) => setTimeout(r, 10))
        hookDone = true
      },
    })

    await server.close()

    // `server.close()` does not resolve until the async hook has completed.
    expect(hookDone).toBe(true)
  })
})
