import { resolve } from 'node:path'
import type { OutputAsset, OutputChunk, RolldownOutput } from 'rolldown'
import { describe, expect, test, vi } from 'vitest'
import { build } from '../../build'
import type { InlineConfig } from '../../config'
import { createLogger } from '../../logger'
import { splitWorkerRequest } from '../../plugins/worker'

const fixturesDir = resolve(import.meta.dirname, 'fixtures')

test.each([
  { sourcemap: true, enrich: false },
  { sourcemap: true, enrich: true },
  { sourcemap: 'hidden', enrich: false },
  { sourcemap: 'hidden', enrich: true },
] as const)(
  'preserves parent and nested worker maps with sourcemap=$sourcemap and enrich=$enrich',
  async ({ sourcemap, enrich }) => {
    const root = resolve(fixturesDir, 'worker-sourcemap')
    const logger = createLogger('silent')
    const warn = vi.spyOn(logger, 'warn')
    const result = (await build({
      configFile: false,
      root,
      publicDir: false,
      customLogger: logger,
      build: {
        write: false,
        sourcemap,
        rolldownOptions: { input: resolve(root, 'entry.js') },
      },
      worker: {
        plugins: () =>
          enrich
            ? [
                {
                  name: 'enrich-worker-sourcemap',
                  generateBundle(_, bundle) {
                    for (const asset of Object.values(bundle)) {
                      if (
                        asset.type !== 'asset' ||
                        !asset.fileName.endsWith('.js.map')
                      ) {
                        continue
                      }
                      expect(typeof asset.source).toBe('string')
                      const map = JSON.parse(asset.source as string)
                      asset.source = JSON.stringify({
                        ...map,
                        x_test_worker_metadata: 'preserved',
                      })
                    }
                  },
                },
              ]
            : [],
      },
    })) as RolldownOutput

    const maps = result.output.filter(
      (asset): asset is OutputAsset =>
        asset.type === 'asset' && /\.worker-.*\.js\.map$/.test(asset.fileName),
    )
    expect(maps).toHaveLength(2)
    for (const asset of maps) {
      expect(typeof asset.source).toBe('string')
      const map = JSON.parse(asset.source as string)
      expect(map.version).toBe(3)
      expect(map.mappings).not.toBe('')
      expect(map.sourcesContent).toEqual(
        expect.arrayContaining([expect.stringContaining('self.postMessage')]),
      )
      if (enrich) {
        expect(map.x_test_worker_metadata).toBe('preserved')
      } else {
        expect(map).not.toHaveProperty('x_test_worker_metadata')
      }
    }
    expect(warn).not.toHaveBeenCalled()
  },
)

describe('splitWorkerRequest', () => {
  for (const [id, postfix] of [
    ['/worker.js', ''],
    ['/worker.js#hash', ''],
    ['/worker.js?worker', ''],
    ['/worker.js?sharedworker', ''],
    ['/worker.js?inline', ''],
    ['/worker.js?url', ''],
    ['/worker.js?worker&url', ''],
    ['/worker.js?worker&inline', ''],
    ['/worker.js?worker&foo&url&bar', '?foo&bar'],
    ['/worker.js?worker&foo&inline', '?foo'],
    ['/worker.js?foo&bar', '?foo&bar'],
    ['/worker.js?foo=foo&worker&bar=bar', '?foo=foo&bar=bar'],
    ['/worker.js?foo&bar&worker', '?foo&bar'],
  ]) {
    test(`splits ${id}`, () => {
      expect(splitWorkerRequest(id)).toEqual({ file: '/worker.js', postfix })
    })
  }
})

for (const { name, environments } of [
  { name: 'default minifier', environments: undefined },
  {
    name: 'oxc client minifier',
    environments: { client: { build: { minify: 'oxc' } } },
  },
  {
    name: 'terser client minifier',
    environments: { client: { build: { minify: 'terser' } } },
  },
] as { name: string; environments: InlineConfig['environments'] }[]) {
  test(`?worker&url should produce the same hash in client and SSR builds with ${name}`, async () => {
    const root = resolve(fixturesDir, 'worker-url')

    const clientResult = (await build({
      root,
      logLevel: 'silent',
      environments,
      build: {
        write: false,
        rolldownOptions: {
          input: resolve(root, 'entry.js'),
        },
      },
    })) as RolldownOutput

    const ssrResult = (await build({
      root,
      logLevel: 'silent',
      environments,
      build: {
        write: false,
        ssr: resolve(root, 'entry.js'),
      },
    })) as RolldownOutput

    // Extract the worker URL from both builds.
    // The entry chunk will contain the worker asset URL as a string.
    const clientEntry = clientResult.output.find(
      (o): o is OutputChunk => o.type === 'chunk' && o.isEntry,
    )!
    const ssrEntry = ssrResult.output.find(
      (o): o is OutputChunk => o.type === 'chunk' && o.isEntry,
    )!

    const workerUrlPattern = /assets\/worker-[\w-]+\.js/g
    const clientWorkerUrls = clientEntry.code.match(workerUrlPattern) ?? []
    const ssrWorkerUrls = ssrEntry.code.match(workerUrlPattern) ?? []

    expect(clientWorkerUrls.length).toBeGreaterThan(0)
    expect(ssrWorkerUrls.length).toBeGreaterThan(0)
    expect(ssrWorkerUrls).toEqual(clientWorkerUrls)
  })
}
