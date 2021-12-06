import { mochaReset, mochaSetup, getColor, isBuild } from '../../testUtils'

describe('optimize-deps.spec.ts', () => {
  before(mochaSetup)
  after(mochaReset)

  it('default + named imports from cjs dep (react)', async () => {
    expect(await page.textContent('.cjs button')).toBe('count is 0')
    await page.click('.cjs button')
    expect(await page.textContent('.cjs button')).toBe('count is 1')
  })

  it('named imports from webpacked cjs (phoenix)', async () => {
    expect(await page.textContent('.cjs-phoenix')).toBe('ok')
  })

  it('default import from webpacked cjs (clipboard)', async () => {
    expect(await page.textContent('.cjs-clipboard')).toBe('ok')
  })

  it('dynamic imports from cjs dep (react)', async () => {
    expect(await page.textContent('.cjs-dynamic button')).toBe('count is 0')
    await page.click('.cjs-dynamic button')
    expect(await page.textContent('.cjs-dynamic button')).toBe('count is 1')
  })

  it('dynamic named imports from webpacked cjs (phoenix)', async () => {
    expect(await page.textContent('.cjs-dynamic-phoenix')).toBe('ok')
  })

  it('dynamic default import from webpacked cjs (clipboard)', async () => {
    expect(await page.textContent('.cjs-dynamic-clipboard')).toBe('ok')
  })

  it('dynamic default import from cjs (cjs-dynamic-dep-cjs-compiled-from-esm)', async () => {
    expect(
      await page.textContent('.cjs-dynamic-dep-cjs-compiled-from-esm')
    ).toBe('ok')
  })

  it('dynamic default import from cjs (cjs-dynamic-dep-cjs-compiled-from-cjs)', async () => {
    expect(
      await page.textContent('.cjs-dynamic-dep-cjs-compiled-from-cjs')
    ).toBe('ok')
  })

  it('dedupe', async () => {
    expect(await page.textContent('.dedupe button')).toBe('count is 0')
    await page.click('.dedupe button')
    expect(await page.textContent('.dedupe button')).toBe('count is 1')
  })

  it('cjs borwser field (axios)', async () => {
    expect(await page.textContent('.cjs-browser-field')).toBe('pong')
  })

  it('dep from linked dep (lodash-es)', async () => {
    expect(await page.textContent('.deps-linked')).toBe('fooBarBaz')
  })

  it('forced include', async () => {
    expect(await page.textContent('.force-include')).toMatch(`[success]`)
  })

  it('import * from optimized dep', async () => {
    expect(await page.textContent('.import-star')).toMatch(`[success]`)
  })

  it('dep with css import', async () => {
    expect(await getColor('h1')).toBe('red')
  })

  it('dep w/ non-js files handled via plugin', async () => {
    expect(await page.textContent('.plugin')).toMatch(`[success]`)
  })

  it('vue + vuex', async () => {
    expect(await page.textContent('.vue')).toMatch(`[success]`)
  })

  it('esbuild-plugin', async () => {
    expect(await page.textContent('.esbuild-plugin')).toMatch(
      isBuild ? `Hello from a package` : `Hello from an esbuild plugin`
    )
  })

  it('import from hidden dir', async () => {
    expect(await page.textContent('.hidden-dir')).toBe('hello!')
  })

  it('import optimize-excluded package that imports optimized-included package', async () => {
    expect(await page.textContent('.nested-include')).toBe('nested-include')
  })
})
