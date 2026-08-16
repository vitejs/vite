import { expect, test } from 'vitest'
import type { OutputAsset, OutputChunk, RolldownOutput } from 'rolldown'
import { build } from 'vite'
import { browserLogs, getColor, isBuild, page, testDir } from '~utils'

test('should have no 404s', () => {
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('404')
  })
})

test('index js', async () => {
  await expect.poll(() => page.textContent('.js')).toBe('js: ok')
})

test('importmap', async () => {
  await expect
    .poll(() => page.textContent('.importmap'))
    .toContain('"/foo": "/bar"')
})

test('static js', async () => {
  await expect.poll(() => page.textContent('.static-js')).toBe('static-js: ok')
})

test('dynamic js', async () => {
  await expect
    .poll(() => page.textContent('.dynamic-js'))
    .toBe('dynamic-js: ok')
})

test('static css', async () => {
  await expect.poll(() => getColor('.static')).toBe('red')
})

test('dynamic css', async () => {
  await expect.poll(() => getColor('.dynamic')).toBe('red')
})

test('direct dynamic css', async () => {
  await expect.poll(() => getColor('.direct-dynamic')).toBe('red')
})

// a CSS-only module shared by multiple chunks becomes a pure CSS chunk that is
// removed from the output. The import map must not keep referencing its removed
// JS file, otherwise chunks importing it 404 and fail to execute
// (https://github.com/vitejs/vite/issues/22740)
test('shared pure css chunk', async () => {
  await expect.poll(() => page.textContent('.shared-js')).toBe('shared-js: ok')
  await expect.poll(() => getColor('.shared')).toBe('green')
})

test('worker', async () => {
  await expect.poll(() => page.textContent('.worker')).toBe('worker: pong')
})

for (const cssFileName of ['dynamic.css', 'direct-dynamic.css']) {
  // This is a correctness requirement, not only a cache optimization: hashed
  // chunk filenames are cached as immutable. If the filename stayed the same
  // while its code changed to reference a new CSS filename, cached JS could
  // load stale CSS alongside newly mapped JS, breaking CSS module selectors.
  test.runIf(isBuild)(
    `${cssFileName} uses a stable import map specifier`,
    async () => {
      const buildWithColor = async (color: string) =>
        (await build({
          root: testDir,
          logLevel: 'silent',
          build: { write: false },
          plugins: [
            {
              name: 'change-dynamic-css',
              enforce: 'pre',
              transform(code, id) {
                if (id.endsWith(`/${cssFileName}`)) {
                  return code.replace('red', color)
                }
              },
            },
          ],
        })) as RolldownOutput

      const getIndexChunk = (output: RolldownOutput) =>
        output.output.find(
          (file): file is OutputChunk => file.type === 'chunk' && file.isEntry,
        )!
      const getImportMap = (output: RolldownOutput) =>
        JSON.parse(
          output.output
            .find(
              (file): file is OutputAsset => file.fileName === 'importmap.json',
            )!
            .source.toString(),
        ).imports as Record<string, string>
      const getCssFileName = (output: RolldownOutput) =>
        output.output.find(
          (file): file is OutputAsset =>
            file.type === 'asset' && file.names.includes(cssFileName),
        )!.fileName

      const redBuild = await buildWithColor('red')
      const blueBuild = await buildWithColor('blue')
      const redIndex = getIndexChunk(redBuild)
      const blueIndex = getIndexChunk(blueBuild)

      // The importer chunk does not change
      // because the CSS reference uses the hash in the import map
      expect(redIndex.fileName).toBe(blueIndex.fileName)
      expect(redIndex.code).toBe(blueIndex.code)

      const redImportMap = getImportMap(redBuild)
      const blueImportMap = getImportMap(blueBuild)
      const cssName = cssFileName.slice(0, -'.css'.length)
      const cssSpecifier = Object.keys(redImportMap).find(
        (specifier) =>
          specifier.includes(`/${cssName}-`) && specifier.endsWith('.css'),
      )!

      // The hash in the import map specifier is stable across builds,
      // but the mapped filename changes properly
      expect(cssSpecifier).toBeDefined()
      expect(redImportMap[cssSpecifier]).toBe(`/${getCssFileName(redBuild)}`)
      expect(blueImportMap[cssSpecifier]).toBe(`/${getCssFileName(blueBuild)}`)
      expect(redImportMap[cssSpecifier]).not.toBe(blueImportMap[cssSpecifier])
    },
  )
}

// `chunkImportMap` rewrites static imports to stable specifiers, so a change
// that only alters a chunk's preload-dep *membership* used to keep the same
// content-hashed filename while the injected `__vite__mapDeps` array changed
// (#23225). The importer hash must move when that list changes.
test.runIf(isBuild)(
  'hashed chunk names move when preload dependency membership changes',
  async () => {
    const extraDepPlugin = (dynamicImportsExtra: boolean) => ({
      name: 'extra-dep-graph',
      resolveId(id: string) {
        if (id === 'virtual:extra-dep') return '\0virtual:extra-dep'
      },
      load(id: string) {
        if (id === '\0virtual:extra-dep') {
          return 'export const extra = () => "extra"'
        }
      },
      transform(code: string, id: string) {
        // A second importer keeps extra-dep a shared chunk instead of inlining it.
        if (id.endsWith('/dynamic2.js')) {
          return `import 'virtual:extra-dep'\n${code}`
        }
        if (dynamicImportsExtra && id.endsWith('/dynamic.js')) {
          return `import 'virtual:extra-dep'\n${code}`
        }
      },
    })

    const buildWithExtraDep = async (dynamicImportsExtra: boolean) =>
      (await build({
        root: testDir,
        logLevel: 'silent',
        build: { write: false },
        plugins: [extraDepPlugin(dynamicImportsExtra)],
      })) as RolldownOutput

    const getIndexChunk = (output: RolldownOutput) =>
      output.output.find(
        (file): file is OutputChunk => file.type === 'chunk' && file.isEntry,
      )!

    const without = await buildWithExtraDep(false)
    const withExtra = await buildWithExtraDep(true)
    const withoutIndex = getIndexChunk(without)
    const withIndex = getIndexChunk(withExtra)

    expect(withIndex.code).not.toBe(withoutIndex.code)
    expect(withIndex.fileName).not.toBe(withoutIndex.fileName)
  },
)
