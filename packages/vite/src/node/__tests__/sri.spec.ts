import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import type { OutputAsset, OutputChunk, RolldownOutput } from 'rolldown'
import { build } from '../build'
import type { SRIHashAlgorithm } from '../build'

const dirname = import.meta.dirname

const SRI_PLACEHOLDER_PREFIX = '__VITE_SRI_'
const SRI_APP = resolve(dirname, 'fixtures/sri-app')
const SRI_CYCLE_APP = resolve(dirname, 'fixtures/sri-cycle-app')

type BuildOverrides = Record<string, unknown>

const buildSriApp = async (overrides: BuildOverrides = {}) =>
  (await build({
    root: SRI_APP,
    logLevel: 'silent',
    build: {
      sri: true,
      write: false,
      minify: false,
      // assetsInlineLimit: 0 keeps the PNG fixture as a separate emitted file
      // so we can verify it's excluded from sri-manifest.
      assetsInlineLimit: 0,
      rollupOptions: {
        output: {
          // Force shared.js into a separate chunk so the entry HTML emits a
          // `<link rel="modulepreload">` tag we can assert integrity on.
          manualChunks(id: string) {
            if (id.endsWith('shared.js')) return 'shared'
            return undefined
          },
        },
      },
      ...overrides,
    },
  })) as RolldownOutput

const findHtmlAsset = (output: RolldownOutput['output']) =>
  output.find(
    (o): o is OutputAsset => o.type === 'asset' && o.fileName.endsWith('.html'),
  )

const findAsset = (output: RolldownOutput['output'], fileName: string) =>
  output.find(
    (o): o is OutputAsset => o.type === 'asset' && o.fileName === fileName,
  )

const getJsChunks = (output: RolldownOutput['output']) =>
  output.filter((o): o is OutputChunk => o.type === 'chunk')

const getMapDepsFileList = (chunk: OutputChunk): string[] => {
  const match = chunk.code.match(/m\.f\|\|\(m\.f=(\[[^\]]*\])\)/)
  expect(match).toBeDefined()
  return JSON.parse(match![1]) as string[]
}

const collectIntegrityAttributes = (html: string) =>
  [...html.matchAll(/integrity="([^"]+)"/g)].map((m) => m[1])

describe('build.sri', () => {
  test('emits HTML integrity attributes for entry script, stylesheet, and modulepreload', async () => {
    const { output } = await buildSriApp()
    const html = findHtmlAsset(output)
    expect(html).toBeDefined()

    const source = String(html!.source)

    // No unresolved SRI placeholders leak into final HTML.
    expect(source).not.toContain(SRI_PLACEHOLDER_PREFIX)

    expect(source).toMatch(
      /<script[^>]*type="module"[^>]*integrity="sha384-[A-Za-z0-9+/=]+"/,
    )
    expect(source).toMatch(
      /<link[^>]*rel="stylesheet"[^>]*integrity="sha384-[A-Za-z0-9+/=]+"/,
    )
    expect(source).toMatch(
      /<link[^>]*rel="modulepreload"[^>]*integrity="sha384-[A-Za-z0-9+/=]+"/,
    )

    // No "integrity" attributes use the literal void 0 expression.
    expect(source).not.toMatch(/integrity="void 0/)
  })

  test.for<SRIHashAlgorithm>(['sha256', 'sha384', 'sha512'])(
    'uses the configured algorithm: %s',
    async (algorithm) => {
      const { output } = await buildSriApp({ sri: algorithm })

      const html = findHtmlAsset(output)!
      const integrityValues = collectIntegrityAttributes(String(html.source))
      expect(integrityValues.length).toBeGreaterThan(0)
      for (const value of integrityValues) {
        expect(value.startsWith(`${algorithm}-`)).toBe(true)
      }

      // Runtime preload integrity strings inside JS use the same algorithm.
      const wrongPrefixRE = new RegExp(
        `["']sha(?!${algorithm.slice(3)}-)\\d{3}-`,
      )
      for (const chunk of getJsChunks(output)) {
        expect(chunk.code).not.toMatch(wrongPrefixRE)
        expect(chunk.code).not.toContain(SRI_PLACEHOLDER_PREFIX)
      }
    },
  )

  test('build.sri: true normalizes to sha384 in emitted output', async () => {
    const { output } = await buildSriApp({ sri: true })
    const html = findHtmlAsset(output)!
    const values = collectIntegrityAttributes(String(html.source))
    expect(values.length).toBeGreaterThan(0)
    for (const v of values) {
      expect(v.startsWith('sha384-')).toBe(true)
    }
  })

  test('runtime dynamic-import preload metadata embeds real integrity values for resolvable deps', async () => {
    const { output } = await buildSriApp()
    const chunks = getJsChunks(output)

    // Negative checks across every emitted JS chunk.
    for (const chunk of chunks) {
      expect(chunk.code).not.toContain(SRI_PLACEHOLDER_PREFIX)
      expect(chunk.code).not.toMatch(/integrity="void 0/)
    }

    const chunkWithMapDeps = chunks.find((c) =>
      c.code.includes('__vite__mapDeps'),
    )
    expect(chunkWithMapDeps).toBeDefined()

    // The integrity store is wired into __vite__mapDeps.
    expect(chunkWithMapDeps!.code).toMatch(/m\.i\|\|\(m\.i=\[/)

    // It contains real sha384 values for resolvable dynamic-import deps.
    expect(chunkWithMapDeps!.code).toMatch(/"sha384-[A-Za-z0-9+/=]+"/)

    // The runtime helper conditionally assigns link.integrity. We assert the
    // shape of the conditional rather than exact variable names to remain
    // robust against syntax-lowering passes.
    expect(chunkWithMapDeps!.code).toMatch(/link\.integrity\s*=/)
  })

  test('runtime preload metadata omits owner static dependencies', async () => {
    const { output } = await buildSriApp()
    const entryChunk = getJsChunks(output).find((chunk) => chunk.isEntry)
    const sharedChunk = getJsChunks(output).find(
      (chunk) => chunk.name === 'shared',
    )
    expect(entryChunk).toBeDefined()
    expect(sharedChunk).toBeDefined()

    const preloadDeps = getMapDepsFileList(entryChunk!)
    expect(preloadDeps).not.toContain(sharedChunk!.fileName)
    expect(preloadDeps.some((dep) => /dynamic-[\w-]+\.js$/.test(dep))).toBe(
      true,
    )
    expect(preloadDeps.some((dep) => /dynamic-[\w-]+\.css$/.test(dep))).toBe(
      true,
    )
  })

  test('manifest.json shape is unchanged and sri-manifest covers JS and CSS only', async () => {
    const { output } = await buildSriApp({ manifest: true })

    const sriManifestAsset = findAsset(output, '.vite/sri-manifest.json')
    const manifestAsset = findAsset(output, '.vite/manifest.json')
    expect(sriManifestAsset).toBeDefined()
    expect(manifestAsset).toBeDefined()

    const sriManifest = JSON.parse(String(sriManifestAsset!.source)) as Record<
      string,
      string
    >
    const manifest = JSON.parse(String(manifestAsset!.source)) as Record<
      string,
      Record<string, unknown>
    >

    // manifest.json entries must not gain SRI fields.
    for (const entry of Object.values(manifest)) {
      expect(entry).not.toHaveProperty('integrity')
      expect(entry).not.toHaveProperty('cssIntegrity')
      // Recursively scan for stray placeholders.
      expect(JSON.stringify(entry)).not.toContain(SRI_PLACEHOLDER_PREFIX)
    }

    const entries = Object.entries(sriManifest)
    expect(entries.length).toBeGreaterThan(0)
    for (const [file, integrity] of entries) {
      expect(file).toMatch(/\.(?:js|mjs|cjs|css)$/)
      expect(integrity).toMatch(/^sha384-[A-Za-z0-9+/=]+$/)
    }

    // The PNG asset is emitted but excluded from sri-manifest.
    const png = output.find((o) => o.fileName.endsWith('.png'))
    expect(png).toBeDefined()
    expect(sriManifest).not.toHaveProperty(png!.fileName)
  })

  test('ssr-manifest integration emits sri-manifest keyed by emitted file names', async () => {
    const { output } = await buildSriApp({ ssrManifest: true })

    const sriManifestAsset = findAsset(output, '.vite/sri-manifest.json')
    const ssrManifestAsset = findAsset(output, '.vite/ssr-manifest.json')
    expect(sriManifestAsset).toBeDefined()
    expect(ssrManifestAsset).toBeDefined()

    const sriManifest = JSON.parse(String(sriManifestAsset!.source)) as Record<
      string,
      string
    >
    const ssrManifest = JSON.parse(String(ssrManifestAsset!.source)) as Record<
      string,
      unknown
    >

    // sri-manifest keys are emitted file names (not public URLs), and each maps
    // to a real emitted output. Values use the configured algorithm prefix.
    const emittedFiles = new Set(output.map((o) => o.fileName))
    for (const [key, value] of Object.entries(sriManifest)) {
      expect(emittedFiles.has(key)).toBe(true)
      expect(value).toMatch(/^sha384-/)
    }

    // ssr-manifest.json shape is unchanged: values are URL arrays.
    for (const value of Object.values(ssrManifest)) {
      expect(Array.isArray(value)).toBe(true)
    }
  })

  test('cyclic preload dependencies fail the build', async () => {
    // A preloads C and injects B through resolveDependencies. B preloads D and
    // injects A the same way. There is no valid order for replacing both
    // chunks' preload integrity placeholders, so the build must fail instead
    // of omitting SRI.
    let error: unknown
    try {
      await build({
        root: SRI_CYCLE_APP,
        logLevel: 'silent',
        build: {
          sri: true,
          write: false,
          minify: false,
          manifest: true,
          modulePreload: {
            resolveDependencies(_filename, deps, { hostId }) {
              if (hostId === 'assets/chunkA.js') {
                return [...deps, 'assets/chunkB.js']
              }
              if (hostId === 'assets/chunkB.js') {
                return [...deps, 'assets/chunkA.js']
              }
              return deps
            },
          },
          rollupOptions: {
            input: { entry: 'entry.js' },
            output: {
              entryFileNames: 'assets/[name].js',
              chunkFileNames: 'assets/[name].js',
              manualChunks(id: string) {
                if (id.endsWith('a.js')) return 'chunkA'
                if (id.endsWith('b.js')) return 'chunkB'
                if (id.endsWith('c.js')) return 'chunkC'
                if (id.endsWith('d.js')) return 'chunkD'
                return undefined
              },
            },
          },
        },
      })
    } catch (e) {
      error = e
    }

    expect(error).toBeInstanceOf(Error)
    const message = (error as Error).message
    expect(message).toContain('Unable to compute SRI integrity for 2 chunks')
    expect(message).toContain('cyclic preload references')
    expect(message).toContain('assets/chunkA.js')
    expect(message).toContain('assets/chunkB.js')
    expect(message).not.toContain(SRI_PLACEHOLDER_PREFIX)
  })
})
