import path from 'node:path'
import { describe, expect, onTestFinished, test } from 'vitest'
import { build } from '../../build'
import type { Plugin } from '../../plugin'
import { resolveConfig } from '../../config'
import { createServer } from '../../server'
import { preview } from '../../preview'
import { promiseWithResolvers } from '../../../shared/utils'

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

const createServerWithPlugin = async (plugin: Plugin) => {
  const server = await createServer({
    configFile: false,
    root: import.meta.dirname,
    plugins: [plugin, resolveEntryPlugin],
    logLevel: 'error',
    server: {
      middlewareMode: true,
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
          httpServer.listen = (...args: unknown[]) => {
            const listener = args.at(-1) as () => void
            listener()
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
})
