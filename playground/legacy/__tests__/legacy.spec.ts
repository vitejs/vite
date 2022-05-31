import {
  findAssetFile,
  getColor,
  isBuild,
  listAssets,
  page,
  readManifest,
  untilUpdated
} from '~utils'

test('should work', async () => {
  expect(await page.textContent('#app')).toMatch('Hello')
})

test('import.meta.env.LEGACY', async () => {
  expect(await page.textContent('#env')).toMatch(isBuild ? 'true' : 'false')
})

// https://github.com/vitejs/vite/issues/3400
test('transpiles down iterators correctly', async () => {
  expect(await page.textContent('#iterators')).toMatch('hello')
})

test('wraps with iife', async () => {
  expect(await page.textContent('#babel-helpers')).toMatch(
    'exposed babel helpers: false'
  )
})

test('generates assets', async () => {
  await untilUpdated(
    () => page.textContent('#assets'),
    isBuild
      ? [
          'index: 404',
          'index-legacy: 404',
          'chunk-async: 404',
          'chunk-async-legacy: 404',
          'immutable-chunk: 200',
          'immutable-chunk-legacy: 200',
          'polyfills-legacy: 404'
        ].join('\n')
      : [
          'index: 404',
          'index-legacy: 404',
          'chunk-async: 404',
          'chunk-async-legacy: 404',
          'immutable-chunk: 404',
          'immutable-chunk-legacy: 404',
          'polyfills-legacy: 404'
        ].join('\n'),
    true
  )
})

test('correctly emits styles', async () => {
  expect(await getColor('#app')).toBe('red')
})

// dynamic import css
test('should load dynamic import with css', async () => {
  await page.click('#dynamic-css-button')
  await untilUpdated(
    () =>
      page.$eval('#dynamic-css', (node) => window.getComputedStyle(node).color),
    'rgb(255, 0, 0)',
    true
  )
})

describe.runIf(isBuild)('build', () => {
  test('should generate correct manifest', async () => {
    const manifest = readManifest()
    // legacy polyfill
    expect(manifest['../../vite/legacy-polyfills-legacy']).toBeDefined()
    expect(manifest['../../vite/legacy-polyfills-legacy'].src).toBe(
      '../../vite/legacy-polyfills-legacy'
    )
    // modern polyfill
    expect(manifest['../../vite/legacy-polyfills']).toBeDefined()
    expect(manifest['../../vite/legacy-polyfills'].src).toBe(
      '../../vite/legacy-polyfills'
    )
  })

  test('should minify legacy chunks with terser', async () => {
    // This is a ghetto heuristic, but terser output seems to reliably start
    // with one of the following, and non-terser output (including unminified or
    // ebuild-minified) does not!
    const terserPattern = /^(?:!function|System.register)/

    expect(findAssetFile(/chunk-async-legacy/)).toMatch(terserPattern)
    expect(findAssetFile(/chunk-async\./)).not.toMatch(terserPattern)
    expect(findAssetFile(/immutable-chunk-legacy/)).toMatch(terserPattern)
    expect(findAssetFile(/immutable-chunk\./)).not.toMatch(terserPattern)
    expect(findAssetFile(/index-legacy/)).toMatch(terserPattern)
    expect(findAssetFile(/index\./)).not.toMatch(terserPattern)
    expect(findAssetFile(/polyfills-legacy/)).toMatch(terserPattern)
  })

  test('should emit css file', async () => {
    expect(listAssets().some((filename) => filename.endsWith('.css')))
  })

  test('includes structuredClone polyfill which is supported after core-js v3', () => {
    expect(findAssetFile(/polyfills-legacy/)).toMatch('"structuredClone"')
    expect(findAssetFile(/polyfills\./)).toMatch('"structuredClone"')
  })
})
