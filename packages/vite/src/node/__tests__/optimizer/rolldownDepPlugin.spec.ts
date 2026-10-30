import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { rolldownDepPlugin } from '../../optimizer/rolldownDepPlugin'
import { normalizePath } from '../../utils'

async function createRolldownDepPluginTransform(cacheDir: string) {
  const baseConfig = {
    cacheDir: normalizePath(cacheDir),
    optimizeDeps: { extensions: [] },
    server: { fs: { allow: [] } },
    resolve: { builtins: [] },
    createResolver: () => ({}),
  }

  const mockEnvironment = {
    config: baseConfig,
    getTopLevelConfig: () => baseConfig,
  } as any

  const plugins = rolldownDepPlugin(mockEnvironment, {}, [])
  const plugin = plugins.find(
    (p: any) => p.name === 'vite:dep-pre-bundle',
  ) as any

  if (!plugin || !plugin.transform) {
    throw new Error('Could not find vite:dep-pre-bundle plugin')
  }

  const handler = plugin.transform.handler

  return async (code: string, id: string) => {
    const result = await handler.call({}, code, normalizePath(id))
    return result?.code || result
  }
}

describe('rolldownDepPlugin transform', async () => {
  const transform = await createRolldownDepPluginTransform('/root/.vite')

  test('rewrite various relative asset formats', async () => {
    const code = `
      const img = new URL('./logo.png', import.meta.url).href
      const icon = new URL('./icons/search.svg', import.meta.url)
      const worker = new URL('./worker.js', import.meta.url)
      const wasm = new URL('./module.wasm', import.meta.url)
    `
    expect(await transform(code, '/root/node_modules/my-lib/dist/index.js'))
      .toMatchInlineSnapshot(`
      "
            const img = new URL('' + "../../node_modules/my-lib/dist/logo.png", import.meta.url).href
            const icon = new URL('' + "../../node_modules/my-lib/dist/icons/search.svg", import.meta.url)
            const worker = new URL('' + "../../node_modules/my-lib/dist/worker.js", import.meta.url)
            const wasm = new URL('' + "../../node_modules/my-lib/dist/module.wasm", import.meta.url)
          "
    `)
  })

  test('respects /* @vite-ignore */', async () => {
    expect(
      await transform(
        "new URL(/* @vite-ignore */ './worker.js', import.meta.url)",
        '/root/node_modules/my-lib/index.js',
      ),
    ).toBeUndefined()
  })

  test('skips non-relative URLs (absolute, data, protocols)', async () => {
    const code = `
      new URL('/absolute/path.png', import.meta.url)
      new URL('https://example.com/worker.js', import.meta.url)
      new URL('data:text/javascript;base64,Y29uc29sZS5sb2coMSk=', import.meta.url)
    `
    expect(
      await transform(code, '/root/node_modules/my-lib/index.js'),
    ).toBeUndefined()
  })

  test('skips dynamic template strings', async () => {
    expect(
      await transform(
        'new URL(`./${name}.js`, import.meta.url)',
        '/root/node_modules/my-lib/index.js',
      ),
    ).toBeUndefined()
  })

  test('handles backticks for static relative strings', async () => {
    expect(
      await transform(
        'new URL(`./static.js`, import.meta.url)',
        '/root/node_modules/my-lib/index.js',
      ),
    ).toMatchInlineSnapshot(
      `"new URL('' + "../../node_modules/my-lib/static.js", import.meta.url)"`,
    )
  })

  test('handles assets with query parameters and hashes', async () => {
    const code = `
      const url1 = new URL('./style.css?raw', import.meta.url)
      const url2 = new URL('./data.json#config', import.meta.url)
    `
    expect(await transform(code, '/root/node_modules/my-lib/index.js'))
      .toMatchInlineSnapshot(`
      "
            const url1 = new URL('' + "../../node_modules/my-lib/style.css?raw", import.meta.url)
            const url2 = new URL('' + "../../node_modules/my-lib/data.json#config", import.meta.url)
          "
    `)
  })

  test('handles deeply nested relative paths', async () => {
    expect(
      await transform(
        "new URL('../../../assets/file.js', import.meta.url)",
        '/root/node_modules/my-lib/dist/deep/folder/index.js',
      ),
    ).toMatchInlineSnapshot(
      `"new URL('' + "../../node_modules/my-lib/assets/file.js", import.meta.url)"`,
    )
  })

  test('rewrite relative URLs even if id is not in node_modules', async () => {
    expect(
      await transform(
        "new URL('./asset.js', import.meta.url)",
        '/root/src/local-dep.js',
      ),
    ).toMatchInlineSnapshot(
      `"new URL('' + "../../src/asset.js", import.meta.url)"`,
    )
  })
})

describe('rolldownDepPlugin resolveId', () => {
  const baseConfig = {
    cacheDir: '/root/.vite',
    optimizeDeps: { extensions: [] },
    server: { fs: { allow: [] } },
    resolve: { builtins: [] },
    createResolver: () => () => undefined,
  }

  const mockEnvironment = {
    config: baseConfig,
    getTopLevelConfig: () => baseConfig,
  } as any

  const plugins = rolldownDepPlugin(mockEnvironment, {}, [])
  const plugin = plugins.find(
    (p: any) => p.name === 'vite:dep-pre-bundle',
  ) as any

  test('matches bare imports and subpath imports with filter', () => {
    const filter = plugin.resolveId.filter.id as RegExp
    expect(filter.test('lodash')).toBe(true)
    expect(filter.test('@vue/reactivity')).toBe(true)
    expect(filter.test('#mode')).toBe(true)
    expect(filter.test('#internal/subpath')).toBe(true)

    expect(filter.test('./relative')).toBe(false)
    expect(filter.test('../parent')).toBe(false)
    expect(filter.test('/root/file')).toBe(false)
    expect(filter.test('C:\\path\\file')).toBe(false)
    expect(filter.test('D:/path/file')).toBe(false)
  })

  test('delegates subpath import to resolver', async () => {
    let calledWith: any = null
    const resolverMockConfig = {
      ...baseConfig,
      resolve: { builtins: [], mainFields: [], conditions: [] },
      createResolver: () => async (id: string, importer?: string) => {
        calledWith = { id, importer }
        return '/root/node_modules/my-lib/dev.js'
      },
    }
    const env = {
      name: 'client',
      config: resolverMockConfig,
      getTopLevelConfig: () => resolverMockConfig,
    } as any

    const pluginsWithResolver = rolldownDepPlugin(env, {}, [])
    const depPlugin = pluginsWithResolver.find(
      (p: any) => p.name === 'vite:dep-pre-bundle',
    ) as any

    const res = await depPlugin.resolveId.handler(
      '#mode',
      '/root/node_modules/my-lib/index.js',
      { kind: 'import-statement' },
    )
    expect(calledWith).toEqual({
      id: '#mode',
      importer: '/root/node_modules/my-lib/index.js',
    })
    expect(res).toEqual({
      id: path.resolve('/root/node_modules/my-lib/dev.js'),
    })
  })
})
