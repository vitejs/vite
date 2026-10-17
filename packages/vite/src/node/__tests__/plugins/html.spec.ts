import path from 'node:path'
import { describe, expect, test, vi } from 'vitest'
import { assetPlugin } from '../../plugins/asset'
import { buildHtmlPlugin } from '../../plugins/html'

// __dirname exists on disk, so reading it as a file throws EISDIR,
// which is exactly what the old code did for a query-only href.
const fixtureDir = path.resolve(__dirname)

function createConfig(): any {
  return {
    root: fixtureDir,
    base: '/',
    publicDir: false,
    isBundled: true,
    command: 'build',
    consumer: 'client',
    envPrefix: 'VITE_',
    env: {},
    define: {},
    html: {},
    rawAssetsInclude: [],
    build: { modulePreload: false, rolldownOptions: {} },
    logger: {
      warn: vi.fn(),
      warnOnce: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    },
    plugins: [],
  }
}

function createPluginContext(config: any): any {
  const environment = {
    config,
    getTopLevelConfig: () => config,
  }
  return {
    environment,
    resolve: async () => null,
    emitFile: () => 'asset-id',
    getModuleInfo: () => null,
    load: async () => null,
  }
}

// https://github.com/vitejs/vite/issues/23807
// Framer exports this exact line on every page; a query-only href is not a
// local asset and must not be read from disk.
const queryOnlyLinkHtml = `<!doctype html>
<html>
  <head>
    <link rel="alternate" type="text/markdown" href="?md">
  </head>
  <body></body>
</html>
`

describe('build-html query-only urls', () => {
  test('does not treat a query-only link href as a local asset', async () => {
    const config = createConfig()
    const pluginContext = createPluginContext(config)
    // populate the same caches a real build sets up in buildStart
    await (assetPlugin(config) as any).buildStart.call(pluginContext)

    const plugin: any = buildHtmlPlugin(config)
    const id = path.join(fixtureDir, 'index.html')
    // On the old code this rejects with
    // "Error: EISDIR: illegal operation on a directory, read"
    // because the query-only href is treated as a local asset.
    const result = await plugin.transform.handler.call(
      pluginContext,
      queryOnlyLinkHtml,
      id,
    )
    const code = typeof result === 'string' ? result : result.code
    // the query-only href must not be turned into a module import
    expect(code).not.toContain('?md')
  })
})
