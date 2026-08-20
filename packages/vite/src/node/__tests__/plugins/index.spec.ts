import { RUNTIME_MODULE_ID } from 'rolldown'
import {
  and,
  code as filterCode,
  exactRegex,
  exclude,
  id as filterId,
  importerId,
  include,
  moduleType,
  or,
} from 'rolldown/filter'
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
    build: { rolldownOptions: { input }, write: false },
    plugins,
    logLevel: 'silent',
  }
}

describe('hook filter with plugin container', async () => {
  const resolveId = vi.fn()
  const load = vi.fn()
  const transformWithId = vi.fn()
  const transformWithCode = vi.fn()
  const composableResolveId = vi.fn()
  const composableLoad = vi.fn()
  const composableTransform = vi.fn()
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
    {
      name: 'composable-filter',
      resolveId: {
        filter: [
          exclude(importerId(/blocked/)),
          include(or(importerId(/.+/), filterId(/^foo\.js$/))),
        ],
        handler: composableResolveId,
      },
      load: {
        filter: [include(filterId(/\.js$/))],
        handler: composableLoad,
      },
      transform: {
        filter: [
          include(
            and(filterId(/\.js$/), filterCode('import_meta'), moduleType('js')),
          ),
        ],
        handler: composableTransform,
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
    expect(composableResolveId).toHaveBeenCalledTimes(2)

    await pluginContainer.resolveId('foo.js', 'blocked.js')
    expect(composableResolveId).toHaveBeenCalledTimes(2)
  })

  test('load', async () => {
    await pluginContainer.load('foo.js')
    await pluginContainer.load('foo.ts')
    expect(load).toHaveBeenCalledTimes(1)
    expect(load).toHaveBeenCalledWith('foo.js', any)
    expect(composableLoad).toHaveBeenCalledTimes(1)
    expect(composableLoad).toHaveBeenCalledWith('foo.js', any)
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
    expect(composableTransform).toHaveBeenCalledTimes(1)
    expect(composableTransform).toHaveBeenCalledWith(
      expect.stringContaining('import_meta'),
      'foo.js',
      any,
    )
  })
})

describe('hook filter with build', async () => {
  const resolveId = vi.fn()
  const load = vi.fn()
  const transformWithId = vi.fn()
  const transformWithCode = vi.fn()
  const composableResolveId = vi.fn()
  const composableLoad = vi.fn()
  const composableTransform = vi.fn()
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
          filter: {
            id: {
              include: '**/*.js',
              exclude: exactRegex(RUNTIME_MODULE_ID),
            },
          },
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
        name: 'composable-filter',
        resolveId: {
          filter: [
            exclude(importerId(/blocked/)),
            include(or(importerId(/.+/), filterId(/^foo\.js$/))),
          ],
          handler: composableResolveId,
        },
        load: {
          filter: [include(filterId(/\.js$/))],
          handler: composableLoad,
        },
        transform: {
          filter: [
            include(
              and(
                filterId(/\.js$/),
                filterCode('import_meta'),
                moduleType('js'),
              ),
            ),
          ],
          handler: composableTransform,
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
    expect(composableResolveId).toHaveBeenCalledTimes(2)
    expect(composableResolveId).toHaveBeenCalledWith('foo.js', undefined, any)
    expect(composableResolveId).toHaveBeenCalledWith('foo.ts', 'foo.js', any)
  })

  test('load', async () => {
    expect(load).toHaveBeenCalledTimes(1)
    expect(load).toHaveBeenCalledWith('foo.js', any)
    expect(composableLoad).toHaveBeenCalledTimes(1)
    expect(composableLoad).toHaveBeenCalledWith('foo.js', any)
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
    expect(composableTransform).toHaveBeenCalledTimes(1)
    expect(composableTransform).toHaveBeenCalledWith(
      expect.stringContaining('import_meta'),
      'foo.js',
      any,
    )
  })
})
