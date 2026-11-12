import { describe, expect, test } from 'vitest'
import { rolldownDepPlugin } from '../../optimizer/rolldownDepPlugin'
import { optionalPeerDepId } from '../../plugins/resolve'
import { SafeModulePaths } from '../../server/safeModulePaths'
import { normalizePath } from '../../utils'

function createRolldownDepPlugins(cacheDir: string) {
  const baseConfig = {
    cacheDir: normalizePath(cacheDir),
    optimizeDeps: { extensions: [] },
    server: { fs: { allow: [] } },
    resolve: { builtins: [] },
    createResolver: () => ({}),
  }

  const mockEnvironment = {
    mode: 'dev',
    safeModulePaths: new SafeModulePaths(),
    config: baseConfig,
    getTopLevelConfig: () => baseConfig,
  } as any

  return rolldownDepPlugin(mockEnvironment, {}, [])
}

async function createRolldownDepPluginTransform(cacheDir: string) {
  const plugins = createRolldownDepPlugins(cacheDir)
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

describe('rolldownDepPlugin escaped specifiers', () => {
  const [assetsPlugin, depPlugin] = createRolldownDepPlugins('/root/.vite')
  const specialCharacters = '\'"`\\\n${value}'

  test('escapes CSS imports', () => {
    // @ts-expect-error load.handler should exist
    const { code } = assetsPlugin.load.handler(
      'vite:dep-pre-bundle:external-conversion/root/asset".css',
    )
    expect(code).toMatchInlineSnapshot(
      `"import "vite-dep-pre-bundle-external:/root/asset\\".css";"`,
    )
  })

  test('escapes CSS module re-exports', () => {
    // @ts-expect-error load.handler should exist
    const { code } = assetsPlugin.load.handler(
      'vite:dep-pre-bundle:external-conversion/root/asset".module.css',
    )
    expect(code).toMatchInlineSnapshot(
      `"export { default } from "vite-dep-pre-bundle-external:/root/asset\\".module.css";export * from "vite-dep-pre-bundle-external:/root/asset\\".module.css";"`,
    )
  })

  test('escapes browser external module names', () => {
    const path = `dep${specialCharacters}`
    // @ts-expect-error load.handler should exist
    const { code } = depPlugin.load.handler(`browser-external:${path}`)
    expect(code).toMatchInlineSnapshot(`
      "    module.exports = Object.create(new Proxy({}, {
              get(_, key) {
              if (
                  key !== '__esModule' &&
                  key !== '__proto__' &&
                  key !== 'constructor' &&
                  key !== 'splice'
              ) {
                  const path = "dep'\\"\`\\\\\\n\${value}"
                  console.warn(\`Module "\${path}" has been externalized for browser compatibility. Cannot access "\${path}.\${key}" in client code. See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.\`)
              }
              }
          }))"
    `)
  })

  test('escapes optional peer dependency names', () => {
    const peerDep = `peer${specialCharacters}`
    const parentDep = `parent${specialCharacters}`
    // @ts-expect-error load.handler should exist
    const { code } = depPlugin.load.handler(
      `optional-peer-dep:${optionalPeerDepId}:${peerDep}:${parentDep}`,
    )
    expect(code).toMatchInlineSnapshot(
      `"module.exports = {};const peerDep = "peer'\\"\`\\\\\\n\${value}";const parentDep = "parent'\\"\`\\\\\\n\${value}";throw new Error(\`Could not resolve "\${peerDep}" imported by "\${parentDep}". Is it installed?\`)"`,
    )
  })
})

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
