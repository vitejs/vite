import {
  listAssets,
  findAssetFile,
  isBuild,
  readManifest,
  untilUpdated,
  getColor
} from '../../testUtils'

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

if (isBuild) {
  test('should generate correct manifest', async () => {
    const manifest = readManifest()
    expect(manifest['../../../vite/legacy-polyfills']).toBeDefined()
    expect(manifest['../../../vite/legacy-polyfills'].src).toBe(
      '../../../vite/legacy-polyfills'
    )
  })

  test('should minify legacy chunks with terser', async () => {
    // This is a ghetto heuristic, but terser output seems to reliably start
    // with one of the following, and non-terser output (including unminified or
    // ebuild-minified) does not!
    const terserPatt = /^(?:!function|System.register)/

    expect(findAssetFile(/chunk-async-legacy/)).toMatch(terserPatt)
    expect(findAssetFile(/chunk-async\./)).not.toMatch(terserPatt)
    expect(findAssetFile(/immutable-chunk-legacy/)).toMatch(terserPatt)
    expect(findAssetFile(/immutable-chunk\./)).not.toMatch(terserPatt)
    expect(findAssetFile(/index-legacy/)).toMatch(terserPatt)
    expect(findAssetFile(/index\./)).not.toMatch(terserPatt)
    expect(findAssetFile(/polyfills-legacy/)).toMatch(terserPatt)
  })

  test('should emit css file', async () => {
    expect(listAssets().some((filename) => filename.endsWith('.css')))
  })
}
