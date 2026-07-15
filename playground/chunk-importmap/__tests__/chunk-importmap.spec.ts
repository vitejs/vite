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

test.runIf(isBuild)('css uses a stable import map specifier', async () => {
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
            if (id.endsWith('/dynamic.css')) {
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
  const getDynamicCssFileName = (output: RolldownOutput) =>
    output.output.find(
      (file): file is OutputAsset =>
        file.type === 'asset' && file.names.includes('dynamic.css'),
    )!.fileName

  const redBuild = await buildWithColor('red')
  const blueBuild = await buildWithColor('blue')
  const redIndex = getIndexChunk(redBuild)
  const blueIndex = getIndexChunk(blueBuild)

  expect(redIndex.fileName).toBe(blueIndex.fileName)
  expect(redIndex.code).toBe(blueIndex.code)

  const redImportMap = getImportMap(redBuild)
  const blueImportMap = getImportMap(blueBuild)
  const dynamicCssSpecifier = Object.keys(redImportMap).find(
    (specifier) =>
      specifier.includes('/dynamic-') && specifier.endsWith('.css'),
  )!

  expect(dynamicCssSpecifier).toBeDefined()
  expect(redImportMap[dynamicCssSpecifier]).toBe(
    `/${getDynamicCssFileName(redBuild)}`,
  )
  expect(blueImportMap[dynamicCssSpecifier]).toBe(
    `/${getDynamicCssFileName(blueBuild)}`,
  )
  expect(redImportMap[dynamicCssSpecifier]).not.toBe(
    blueImportMap[dynamicCssSpecifier],
  )
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
