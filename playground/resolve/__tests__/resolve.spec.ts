import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import { isBuild, isWindows, page, testDir, viteTestUrl } from '~utils'

test('bom import', async () => {
  expect(await page.textContent('.utf8-bom')).toMatch('[success]')
})

test('deep import', async () => {
  expect(await page.textContent('.deep-import')).toMatch('[2,4]')
})

test('exports and a nested package scope with a different type', async () => {
  expect(await page.textContent('.exports-and-nested-scope')).toMatch(
    '[success]',
  )
})

test('entry with exports field', async () => {
  expect(await page.textContent('.exports-entry')).toMatch('[success]')
})

test('deep import with exports field', async () => {
  expect(await page.textContent('.exports-deep')).toMatch('[success]')
})

test('deep import with query with exports field', async () => {
  // since it is imported with `?url` it should return a URL
  expect(await page.textContent('.exports-deep-query')).toMatch(
    isBuild ? /base64/ : '/exports-path/deep.json',
  )
})

test('deep import with exports field + exposed dir', async () => {
  expect(await page.textContent('.exports-deep-exposed-dir')).toMatch(
    '[success]',
  )
})

test('deep import with exports field + mapped dir', async () => {
  expect(await page.textContent('.exports-deep-mapped-dir')).toMatch(
    '[success]',
  )
})

test('exports read from the root package.json', async () => {
  expect(await page.textContent('.exports-from-root')).toMatch('[success]')
})

// this is how Svelte 3 is packaged
test('deep import with exports and legacy fallback', async () => {
  expect(await page.textContent('.exports-legacy-fallback')).toMatch(
    '[success]',
  )
})

test('Respect exports field env key priority', async () => {
  expect(await page.textContent('.exports-env')).toMatch('[success]')
})

test('Respect production/development conditionals', async () => {
  expect(await page.textContent('.exports-env')).toMatch(
    isBuild ? `browser.prod.mjs` : `browser.mjs`,
  )
})

test('Respect exports to take precedence over mainFields', async () => {
  expect(await page.textContent('.exports-with-module')).toMatch('[success]')
})

test('import and require resolve using module condition', async () => {
  expect(await page.textContent('.exports-with-module-condition')).toMatch(
    '[success]',
  )
  expect(
    await page.textContent('.exports-with-module-condition-required'),
  ).toMatch('[success]')
})

test('implicit dir/index.js', async () => {
  expect(await page.textContent('.index')).toMatch('[success]')
})

test('implicit dir/index.js vs explicit file', async () => {
  expect(await page.textContent('.dir-vs-file')).toMatch('[success]')
})

test('nested extension', async () => {
  expect(await page.textContent('.nested-extension')).toMatch(
    '[success] file.json.js',
  )
})

test('exact extension vs. duplicated (.js.js)', async () => {
  expect(await page.textContent('.exact-extension')).toMatch('[success]')
})

test('dont add extension to directory name (./dir-with-ext.js/index.js)', async () => {
  expect(await page.textContent('.dir-with-ext')).toMatch('[success]')
})

test('do not resolve to the `module` field if the importer is a `require` call', async () => {
  expect(await page.textContent('.require-pkg-with-module-field')).toMatch(
    '[success]',
  )
})

test('a ts module can import another ts module using its corresponding js file name', async () => {
  expect(await page.textContent('.ts-extension')).toMatch('[success]')
})

test('filename with dot', async () => {
  expect(await page.textContent('.dot')).toMatch('[success]')
})

test.runIf(isWindows)('drive-relative path', async () => {
  expect(await page.textContent('.drive-relative')).toMatch('[success]')
})

test('absolute path', async () => {
  expect(await page.textContent('.absolute')).toMatch('[success]')
})

test('file url', async () => {
  expect(await page.textContent('.file-url')).toMatch('[success]')
})

test('browser field', async () => {
  expect(await page.textContent('.browser')).toMatch('[success]')
})

test('Resolve browser field even if module field exists', async () => {
  expect(await page.textContent('.browser-module1')).toMatch('[success]')
})

test('Resolve module field if browser field is likely UMD or CJS', async () => {
  expect(await page.textContent('.browser-module2')).toMatch('[success]')
})

test('Resolve module field if browser field is likely IIFE', async () => {
  expect(await page.textContent('.browser-module3')).toMatch('[success]')
})

test('css entry', async () => {
  expect(await page.textContent('.css')).toMatch('[success]')
})

test('monorepo linked dep', async () => {
  expect(await page.textContent('.monorepo')).toMatch('[success]')
})

test('plugin resolved virtual file', async () => {
  expect(await page.textContent('.virtual')).toMatch('[success]')
})

test('plugin resolved custom virtual file', async () => {
  expect(await page.textContent('.custom-virtual')).toMatch('[success]')
})

test('resolve inline package', async () => {
  expect(await page.textContent('.inline-pkg')).toMatch('[success]')
})

test('resolve.extensions', async () => {
  expect(await page.textContent('.custom-ext')).toMatch('[success]')
})

test('resolve.mainFields', async () => {
  expect(await page.textContent('.custom-main-fields')).toMatch('[success]')
})

test('resolve.mainFields.browser-first', async () => {
  expect(await page.textContent('.custom-browser-main-field')).toBe(
    'resolved browser field',
  )
})

test('resolve.conditions', async () => {
  expect(await page.textContent('.custom-condition')).toMatch('[success]')
})

test('resolve package that contains # in path', async () => {
  expect(await page.textContent('.path-contains-sharp-symbol')).toMatch(
    '[success] true #',
  )
})

test('Resolving top level with imports field', async () => {
  expect(await page.textContent('.imports-top-level')).toMatch('[success]')
})

test('Resolving same level with imports field', async () => {
  expect(await page.textContent('.imports-same-level')).toMatch(
    await page.textContent('.imports-top-level'),
  )
})

test('Resolving nested path with imports field', async () => {
  expect(await page.textContent('.imports-nested')).toMatch('[success]')
})

test('Resolving star with imports filed', async () => {
  expect(await page.textContent('.imports-star')).toMatch('[success]')
})

test('Resolving slash with imports filed', async () => {
  expect(await page.textContent('.imports-slash')).toMatch('[success]')
})

test('Resolving from other package with imports field', async () => {
  expect(await page.textContent('.imports-pkg-slash')).toMatch('[success]')
})

test('Resolving with query with imports field', async () => {
  // since it is imported with `?url` it should return a URL
  expect(await page.textContent('.imports-query')).toMatch(
    isBuild ? /base64/ : '/imports-path/query.json',
  )
})

test('Resolve doesnt interrupt page request with trailing query and .css', async () => {
  await page.goto(viteTestUrl + '/?test.css')
  expect(await page.locator('vite-error-overlay').count()).toBe(0)
  expect(await page.textContent('h1')).toBe('Resolve')
})

test('resolve non-normalized absolute path', async () => {
  expect(await page.textContent('.non-normalized')).toMatch('[success]')
})

test.runIf(!isWindows)(
  'Resolve doesnt interrupt page request that clashes with local project package.json',
  async () => {
    // Sometimes request path may point to a different project's package.json, but for testing
    // we point to Vite's own monorepo which always exists, and the package.json is not a library
    const pathToViteMonorepoRoot = new URL('../../../', import.meta.url)
    const urlPath = fileURLToPath(pathToViteMonorepoRoot).replace(/\/$/, '')
    await page.goto(viteTestUrl + urlPath)
    expect(await page.locator('vite-error-overlay').count()).toBe(0)
    expect(await page.textContent('h1')).toBe('Resolve')
  },
)

test.runIf(isBuild)('public dir is not copied', async () => {
  expect(
    fs.existsSync(path.resolve(testDir, 'dist/should-not-be-copied')),
  ).toBe(false)
})
