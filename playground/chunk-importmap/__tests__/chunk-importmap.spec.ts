import { expect, test } from 'vitest'
import type { OutputAsset, OutputChunk, RolldownOutput } from 'rolldown'
import { build } from 'vite'
import {
  browserLogs,
  getColor,
  isBuild,
  isBundledDev,
  page,
  testDir,
} from '~utils'

test.skipIf(isBundledDev)('should have no 404s', () => {
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('404')
  })
})

test.skipIf(isBundledDev)('index js', async () => {
  await expect.poll(() => page.textContent('.js')).toBe('js: ok')
})

test.skipIf(isBundledDev)('importmap', async () => {
  await expect
    .poll(() => page.textContent('.importmap'))
    .toContain('"/foo": "/bar"')
})

test.skipIf(isBundledDev)('static js', async () => {
  await expect.poll(() => page.textContent('.static-js')).toBe('static-js: ok')
})

test.skipIf(isBundledDev)('dynamic js', async () => {
  await expect
    .poll(() => page.textContent('.dynamic-js'))
    .toBe('dynamic-js: ok')
})

test.skipIf(isBundledDev)('static css', async () => {
  await expect.poll(() => getColor('.static')).toBe('red')
})

test.skipIf(isBundledDev)('dynamic css', async () => {
  await expect.poll(() => getColor('.dynamic')).toBe('red')
})

test.skipIf(isBundledDev)('direct dynamic css', async () => {
  await expect.poll(() => getColor('.direct-dynamic')).toBe('red')
})

// a CSS-only module shared by multiple chunks becomes a pure CSS chunk that is
// removed from the output. The import map must not keep referencing its removed
// JS file, otherwise chunks importing it 404 and fail to execute
// (https://github.com/vitejs/vite/issues/22740)
test.skipIf(isBundledDev)('shared pure css chunk', async () => {
  await expect.poll(() => page.textContent('.shared-js')).toBe('shared-js: ok')
  await expect.poll(() => getColor('.shared')).toBe('green')
})

test.skipIf(isBundledDev)('worker', async () => {
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
