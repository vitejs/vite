import { mochaReset, mochaSetup, isBuild } from '../../testUtils'

describe('resolve.spec.ts', () => {
  before(mochaSetup)
  after(mochaReset)

  it('bom import', async () => {
    expect(await page.textContent('.utf8-bom')).toMatch('[success]')
  })

  it('deep import', async () => {
    expect(await page.textContent('.deep-import')).toMatch('[2,4]')
  })

  it('entry with exports field', async () => {
    expect(await page.textContent('.exports-entry')).toMatch('[success]')
  })

  it('deep import with exports field', async () => {
    expect(await page.textContent('.exports-deep')).toMatch('[success]')
  })

  it('deep import with exports field + exposed dir', async () => {
    expect(await page.textContent('.exports-deep-exposed-dir')).toMatch(
      '[success]'
    )
  })

  it('deep import with exports field + mapped dir', async () => {
    expect(await page.textContent('.exports-deep-mapped-dir')).toMatch(
      '[success]'
    )
  })

  it('Respect exports field env key priority', async () => {
    expect(await page.textContent('.exports-env')).toMatch('[success]')
  })

  it('Respect production/development conditionals', async () => {
    expect(await page.textContent('.exports-env')).toMatch(
      isBuild ? `browser.prod.mjs` : `browser.mjs`
    )
  })

  it('implicit dir/index.js', async () => {
    expect(await page.textContent('.index')).toMatch('[success]')
  })

  it('implicit dir/index.js vs explicit file', async () => {
    expect(await page.textContent('.dir-vs-file')).toMatch('[success]')
  })

  it('exact extension vs. duplicated (.js.js)', async () => {
    expect(await page.textContent('.exact-extension')).toMatch('[success]')
  })

  it('dont add extension to directory name (./dir-with-ext.js/index.js)', async () => {
    expect(await page.textContent('.dir-with-ext')).toMatch('[success]')
  })

  it('a ts module can import another ts module using its corresponding js file name', async () => {
    expect(await page.textContent('.ts-extension')).toMatch('[success]')
  })

  it('filename with dot', async () => {
    expect(await page.textContent('.dot')).toMatch('[success]')
  })

  it('browser field', async () => {
    expect(await page.textContent('.browser')).toMatch('[success]')
  })

  it('css entry', async () => {
    expect(await page.textContent('.css')).toMatch('[success]')
  })

  it('monorepo linked dep', async () => {
    expect(await page.textContent('.monorepo')).toMatch('[success]')
  })

  it('plugin resolved virtual file', async () => {
    expect(await page.textContent('.virtual')).toMatch('[success]')
  })

  it('plugin resolved custom virtual file', async () => {
    expect(await page.textContent('.custom-virtual')).toMatch('[success]')
  })

  it('resolve inline package', async () => {
    expect(await page.textContent('.inline-pkg')).toMatch('[success]')
  })

  it('resolve.extensions', async () => {
    expect(await page.textContent('.custom-ext')).toMatch('[success]')
  })

  it('resolve.mainFields', async () => {
    expect(await page.textContent('.custom-main-fields')).toMatch('[success]')
  })

  it('resolve.conditions', async () => {
    expect(await page.textContent('.custom-condition')).toMatch('[success]')
  })

  it('resolve package that contains # in path', async () => {
    expect(await page.textContent('.path-contains-sharp-symbol')).toMatch(
      '[success]'
    )
  })
})
