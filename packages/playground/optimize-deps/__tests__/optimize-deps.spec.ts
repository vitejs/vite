import { getColor, isBuild } from '../../testUtils'

test('default + named imports from cjs dep (react)', async () => {
  expect(await page.textContent('.cjs button')).toBe('count is 0')
  await page.click('.cjs button')
  expect(await page.textContent('.cjs button')).toBe('count is 1')
})

test('named imports from webpacked cjs (phoenix)', async () => {
  expect(await page.textContent('.cjs-phoenix')).toBe('ok')
})

test('default import from webpacked cjs (clipboard)', async () => {
  expect(await page.textContent('.cjs-clipboard')).toBe('ok')
})

test('dynamic imports from cjs dep (react)', async () => {
  expect(await page.textContent('.cjs-dynamic button')).toBe('count is 0')
  await page.click('.cjs-dynamic button')
  expect(await page.textContent('.cjs-dynamic button')).toBe('count is 1')
})

test('dynamic named imports from webpacked cjs (phoenix)', async () => {
  expect(await page.textContent('.cjs-dynamic-phoenix')).toBe('ok')
})

test('dynamic default import from webpacked cjs (clipboard)', async () => {
  expect(await page.textContent('.cjs-dynamic-clipboard')).toBe('ok')
})

test('dynamic default import from cjs (cjs-dynamic-dep-cjs-compiled-from-esm)', async () => {
  expect(await page.textContent('.cjs-dynamic-dep-cjs-compiled-from-esm')).toBe(
    'ok'
  )
})

test('dynamic default import from cjs (cjs-dynamic-dep-cjs-compiled-from-cjs)', async () => {
  expect(await page.textContent('.cjs-dynamic-dep-cjs-compiled-from-cjs')).toBe(
    'ok'
  )
})

test('dedupe', async () => {
  expect(await page.textContent('.dedupe button')).toBe('count is 0')
  await page.click('.dedupe button')
  expect(await page.textContent('.dedupe button')).toBe('count is 1')
})

test('cjs browser field (axios)', async () => {
  expect(await page.textContent('.cjs-browser-field')).toBe('pong')
})

test('dep from linked dep (lodash-es)', async () => {
  expect(await page.textContent('.deps-linked')).toBe('fooBarBaz')
})

test('forced include', async () => {
  expect(await page.textContent('.force-include')).toMatch(`[success]`)
})

test('import * from optimized dep', async () => {
  expect(await page.textContent('.import-star')).toMatch(`[success]`)
})

test('import from dep with .notjs files', async () => {
  expect(await page.textContent('.not-js')).toMatch(`[success]`)
})

test('dep with dynamic import', async () => {
  expect(await page.textContent('.dep-with-dynamic-import')).toMatch(
    `[success]`
  )
})

test('dep with css import', async () => {
  expect(await getColor('h1')).toBe('red')
})

test('dep w/ non-js files handled via plugin', async () => {
  expect(await page.textContent('.plugin')).toMatch(`[success]`)
})

test('vue + vuex', async () => {
  expect(await page.textContent('.vue')).toMatch(`[success]`)
})

test('esbuild-plugin', async () => {
  expect(await page.textContent('.esbuild-plugin')).toMatch(
    isBuild ? `Hello from a package` : `Hello from an esbuild plugin`
  )
})

test('import from hidden dir', async () => {
  expect(await page.textContent('.hidden-dir')).toBe('hello!')
})

test('import optimize-excluded package that imports optimized-included package', async () => {
  expect(await page.textContent('.nested-include')).toBe('nested-include')
})

test('import aliased package with colon', async () => {
  expect(await page.textContent('.url')).toBe('vitejs.dev')
})

test('variable names are reused in different scripts', async () => {
  expect(await page.textContent('.reused-variable-names')).toBe('reused')
})
