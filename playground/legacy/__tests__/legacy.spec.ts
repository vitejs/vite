import { describe, expect, test } from 'vitest'
import {
  findAssetFile,
  getColor,
  isBuild,
  listAssets,
  page,
  readManifest,
  untilUpdated,
} from '~utils'

test('should load the worker', async () => {
  await untilUpdated(() => page.textContent('.worker-message'), 'module', true)
})

test('should work', async () => {
  await untilUpdated(() => page.textContent('#app'), 'Hello', true)
})

test('import.meta.env.LEGACY', async () => {
  await untilUpdated(
    () => page.textContent('#env'),
    isBuild ? 'true' : 'false',
    true,
  )
  await untilUpdated(() => page.textContent('#env-equal'), 'true', true)
})

// https://github.com/vitejs/vite/issues/3400
test('transpiles down iterators correctly', async () => {
  await untilUpdated(() => page.textContent('#iterators'), 'hello', true)
})

test('async generator', async () => {
  await untilUpdated(
    () => page.textContent('#async-generator'),
    '[0,1,2]',
    true,
  )
})

test('wraps with iife', async () => {
  await untilUpdated(
    () => page.textContent('#babel-helpers'),
    'exposed babel helpers: false',
    true,
  )
})

test('generates assets', async () => {
  await untilUpdated(
    () => page.textContent('#assets'),
    isBuild
      ? [
          'index: text/html',
          'index-legacy: text/html',
          'chunk-async: text/html',
          'chunk-async-legacy: text/html',
          'immutable-chunk: application/javascript',
          'immutable-chunk-legacy: application/javascript',
          'polyfills-legacy: text/html',
        ].join('\n')
      : [
          'index: text/html',
          'index-legacy: text/html',
          'chunk-async: text/html',
          'chunk-async-legacy: text/html',
          'immutable-chunk: text/html',
          'immutable-chunk-legacy: text/html',
          'polyfills-legacy: text/html',
        ].join('\n'),
    true,
  )
})

test('correctly emits styles', async () => {
  expect(await getColor('#app')).toBe('red')
})

// dynamic import css
test('should load dynamic import with css', async () => {
  await page.click('#dynamic-css-button')
  await untilUpdated(() => getColor('#dynamic-css'), 'red', true)
})

test('asset url', async () => {
  expect(await page.textContent('#asset-path')).toMatch(
    isBuild ? /\/assets\/vite-[-\w]+\.svg/ : '/vite.svg',
  )
})

describe.runIf(isBuild)('build', () => {
  test('should generate correct manifest', async () => {
    const manifest = readManifest()
    // legacy polyfill
    expect(manifest['../../vite/legacy-polyfills-legacy']).toBeDefined()
    expect(manifest['../../vite/legacy-polyfills-legacy'].src).toBe(
      '../../vite/legacy-polyfills-legacy',
    )
    expect(manifest['custom0-legacy.js'].file).toMatch(
      /chunk-X-legacy\.[-\w]{8}.js/,
    )
    expect(manifest['custom1-legacy.js'].file).toMatch(
      /chunk-X-legacy-[-\w]{8}.js/,
    )
    expect(manifest['custom2-legacy.js'].file).toMatch(
      /chunk-X-legacy[-\w]{8}.js/,
    )
    // modern polyfill
    expect(manifest['../../vite/legacy-polyfills']).toBeDefined()
    expect(manifest['../../vite/legacy-polyfills'].src).toBe(
      '../../vite/legacy-polyfills',
    )
  })

  test('should minify legacy chunks with terser', async () => {
    // This is a ghetto heuristic, but terser output seems to reliably start
    // with one of the following, and non-terser output (including unminified or
    // esbuild-minified) does not!
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
    expect(
      listAssets().some((filename) => filename.endsWith('.css')),
    ).toBeTruthy()
  })

  test('includes structuredClone polyfill which is supported after core-js v3', () => {
    expect(findAssetFile(/polyfills-legacy/)).toMatch('"structuredClone"')
    expect(findAssetFile(/polyfills-[-\w]{8}\./)).toMatch('"structuredClone"')
  })

  test('should generate legacy sourcemap file', async () => {
    expect(
      listAssets().some((filename) => /index-legacy.+\.map$/.test(filename)),
    ).toBeTruthy()
    expect(
      listAssets().some((filename) =>
        /polyfills-legacy.+\.map$/.test(filename),
      ),
    ).toBeFalsy()
  })
})
