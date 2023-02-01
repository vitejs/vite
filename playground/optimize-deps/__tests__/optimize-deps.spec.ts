import { expect, test } from 'vitest'
import {
  browserErrors,
  browserLogs,
  getColor,
  isBuild,
  isServe,
  page,
} from '~utils'

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
    'ok',
  )
})

test('dynamic default import from cjs (cjs-dynamic-dep-cjs-compiled-from-cjs)', async () => {
  expect(await page.textContent('.cjs-dynamic-dep-cjs-compiled-from-cjs')).toBe(
    'ok',
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

test('cjs browser field bare', async () => {
  expect(await page.textContent('.cjs-browser-field-bare')).toBe('pong')
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

test('import from dep with process.env.NODE_ENV', async () => {
  expect(await page.textContent('.node-env')).toMatch(isBuild ? 'prod' : 'dev')
})

test('import from dep with .notjs files', async () => {
  expect(await page.textContent('.not-js')).toMatch(`[success]`)
})

test('Import from dependency which uses relative path which needs to be resolved by main field', async () => {
  expect(await page.textContent('.relative-to-main')).toMatch(`[success]`)
})

test('dep with dynamic import', async () => {
  expect(await page.textContent('.dep-with-dynamic-import')).toMatch(
    `[success]`,
  )
})

test('dep with optional peer dep', async () => {
  expect(await page.textContent('.dep-with-optional-peer-dep')).toMatch(
    `[success]`,
  )
  if (isServe) {
    expect(browserErrors.map((error) => error.message)).toEqual(
      expect.arrayContaining([
        'Could not resolve "foobar" imported by "@vitejs/test-dep-with-optional-peer-dep". Is it installed?',
      ]),
    )
  }
})

test('dep with css import', async () => {
  expect(await getColor('.dep-linked-include')).toBe('red')
})

test('CJS dep with css import', async () => {
  expect(await getColor('.cjs-with-assets')).toBe('blue')
})

test('externalize known non-js files in optimize included dep', async () => {
  expect(await page.textContent('.externalize-known-non-js')).toMatch(
    `[success]`,
  )
})

test('vue + vuex', async () => {
  expect(await page.textContent('.vue')).toMatch(`[success]`)
})

// When we use the Rollup CommonJS plugin instead of esbuild prebundling,
// the esbuild plugins won't apply to dependencies
test('esbuild-plugin', async () => {
  expect(await page.textContent('.esbuild-plugin')).toMatch(
    `Hello from an esbuild plugin`,
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

test('flatten id should generate correctly', async () => {
  expect(await page.textContent('.clonedeep-slash')).toBe('clonedeep-slash')
  expect(await page.textContent('.clonedeep-dot')).toBe('clonedeep-dot')
})

test('non optimized module is not duplicated', async () => {
  expect(
    await page.textContent('.non-optimized-module-is-not-duplicated'),
  ).toBe('from-absolute-path, from-relative-path')
})

test.runIf(isServe)('error on builtin modules usage', () => {
  expect(browserLogs).toEqual(
    expect.arrayContaining([
      // from dep-with-builtin-module-esm
      expect.stringMatching(/dep-with-builtin-module-esm.*is not a function/),
      // dep-with-builtin-module-esm warnings
      expect.stringContaining(
        'Module "fs" has been externalized for browser compatibility. Cannot access "fs.readFileSync" in client code.',
      ),
      expect.stringContaining(
        'Module "path" has been externalized for browser compatibility. Cannot access "path.join" in client code.',
      ),
      // from dep-with-builtin-module-cjs
      expect.stringMatching(/dep-with-builtin-module-cjs.*is not a function/),
      // dep-with-builtin-module-cjs warnings
      expect.stringContaining(
        'Module "fs" has been externalized for browser compatibility. Cannot access "fs.readFileSync" in client code.',
      ),
      expect.stringContaining(
        'Module "path" has been externalized for browser compatibility. Cannot access "path.join" in client code.',
      ),
    ]),
  )

  expect(browserErrors.map((error) => error.message)).toEqual(
    expect.arrayContaining([
      // from user source code
      expect.stringContaining(
        'Module "buffer" has been externalized for browser compatibility. Cannot access "buffer.Buffer" in client code.',
      ),
      expect.stringContaining(
        'Module "child_process" has been externalized for browser compatibility. Cannot access "child_process.execSync" in client code.',
      ),
    ]),
  )
})
