import { afterAll, describe, expect, test, vi } from 'vitest'
import { type InlineConfig, type Plugin, build, createServer } from '../..'

const getConfigWithPlugin = (
  plugins: Plugin[],
  input?: string[],
): InlineConfig => {
  return {
    configFile: false,
    server: { middlewareMode: true, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
    build: { rollupOptions: { input }, write: false },
    plugins,
    logLevel: 'silent',
  }
}

describe('hook filter with plugin container', async () => {
  const resolveId = vi.fn()
  const load = vi.fn()
  const transformWithId = vi.fn()
  const transformWithCode = vi.fn()
  const any = expect.toSatisfy(() => true) // anything including undefined and null
  const config = getConfigWithPlugin([
    {
      name: 'test',
      resolveId: {
        filter: { id: /\.js$/ },
        handler: resolveId,
      },
      load: {
        filter: { id: '**/*.js' },
        handler: load,
      },
      transform: {
        filter: { id: '**/*.js' },
        handler: transformWithId,
      },
    },
    {
      name: 'test2',
      transform: {
        filter: { code: 'import.meta' },
        handler: transformWithCode,
      },
    },
  ])
  const server = await createServer(config)
  afterAll(async () => {
    await server.close()
  })
  const pluginContainer = server.environments.ssr.pluginContainer

  test('resolveId', async () => {
    await pluginContainer.resolveId('foo.js')
    await pluginContainer.resolveId('foo.ts')
    expect(resolveId).toHaveBeenCalledTimes(1)
    expect(resolveId).toHaveBeenCalledWith('foo.js', any, any)
  })

  test('load', async () => {
    await pluginContainer.load('foo.js')
    await pluginContainer.load('foo.ts')
    expect(load).toHaveBeenCalledTimes(1)
    expect(load).toHaveBeenCalledWith('foo.js', any)
  })

  test('transform', async () => {
    await server.environments.ssr.moduleGraph.ensureEntryFromUrl('foo.js')
    await server.environments.ssr.moduleGraph.ensureEntryFromUrl('foo.ts')

    await pluginContainer.transform('import_meta', 'foo.js')
    await pluginContainer.transform('import.meta', 'foo.ts')
    expect(transformWithId).toHaveBeenCalledTimes(1)
    expect(transformWithId).toHaveBeenCalledWith(
      expect.stringContaining('import_meta'),
      'foo.js',
      any,
    )
    expect(transformWithCode).toHaveBeenCalledTimes(1)
    expect(transformWithCode).toHaveBeenCalledWith(
      expect.stringContaining('import.meta'),
      'foo.ts',
      any,
    )
  })
})

describe('hook filter with build', async () => {
  const resolveId = vi.fn()
  const load = vi.fn()
  const transformWithId = vi.fn()
  const transformWithCode = vi.fn()
  const any = expect.anything()
  const config = getConfigWithPlugin(
    [
      {
        name: 'test',
        resolveId: {
          filter: { id: /\.js$/ },
          handler: resolveId,
        },
        load: {
          filter: { id: '**/*.js' },
          handler: load,
        },
        transform: {
          filter: { id: '**/*.js' },
          handler: transformWithId,
        },
      },
      {
        name: 'test2',
        transform: {
          filter: { code: 'import.meta' },
          handler: transformWithCode,
        },
      },
      {
        name: 'resolver',
        resolveId(id) {
          return id
        },
        load(id) {
          if (id === 'foo.js') {
            return 'import "foo.ts"\n' + 'import_meta'
          }
          if (id === 'foo.ts') {
            return 'import.meta'
          }
        },
      },
    ],
    ['foo.js', 'foo.ts'],
  )
  await build(config)

  test('resolveId', async () => {
    expect(resolveId).toHaveBeenCalledTimes(1)
    expect(resolveId).toHaveBeenCalledWith('foo.js', undefined, any)
  })

  test('load', async () => {
    expect(load).toHaveBeenCalledTimes(1)
    expect(load).toHaveBeenCalledWith('foo.js', any)
  })

  test('transform', async () => {
    expect(transformWithId).toHaveBeenCalledTimes(1)
    expect(transformWithId).toHaveBeenCalledWith(
      expect.stringContaining('import_meta'),
      'foo.js',
      any,
    )
    expect(transformWithCode).toHaveBeenCalledTimes(1)
    expect(transformWithCode).toHaveBeenCalledWith(
      expect.stringContaining('import.meta'),
      'foo.ts',
      any,
    )
  })
})
