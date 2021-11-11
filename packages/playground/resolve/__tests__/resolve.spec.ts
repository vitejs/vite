import { isBuild } from '../../testUtils'

test('bom import', async () => {
  expect(await page.textContent('.utf8-bom')).toMatch('[success]')
})

test('deep import', async () => {
  expect(await page.textContent('.deep-import')).toMatch('[2,4]')
})

test('entry with exports field', async () => {
  expect(await page.textContent('.exports-entry')).toMatch('[success]')
})

test('deep import with exports field', async () => {
  expect(await page.textContent('.exports-deep')).toMatch('[success]')
})

test('deep import with exports field + exposed dir', async () => {
  expect(await page.textContent('.exports-deep-exposed-dir')).toMatch(
    '[success]'
  )
})

test('deep import with exports field + mapped dir', async () => {
  expect(await page.textContent('.exports-deep-mapped-dir')).toMatch(
    '[success]'
  )
})

test('Respect exports field env key priority', async () => {
  expect(await page.textContent('.exports-env')).toMatch('[success]')
})

test('Respect production/development conditionals', async () => {
  expect(await page.textContent('.exports-env')).toMatch(
    isBuild ? `browser.prod.mjs` : `browser.mjs`
  )
})

test('implicit dir/index.js', async () => {
  expect(await page.textContent('.index')).toMatch('[success]')
})

test('implicit dir/index.js vs explicit file', async () => {
  expect(await page.textContent('.dir-vs-file')).toMatch('[success]')
})

test('exact extension vs. duplicated (.js.js)', async () => {
  expect(await page.textContent('.exact-extension')).toMatch('[success]')
})

test('dont add extension to directory name (./dir-with-ext.js/index.js)', async () => {
  expect(await page.textContent('.dir-with-ext')).toMatch('[success]')
})

test('a ts module can import another ts module using its corresponding js file name', async () => {
  expect(await page.textContent('.ts-extension')).toMatch('[success]')
})

test('filename with dot', async () => {
  expect(await page.textContent('.dot')).toMatch('[success]')
})

test('browser field', async () => {
  expect(await page.textContent('.browser')).toMatch('[success]')
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

test('resolve inline package', async () => {
  expect(await page.textContent('.inline-pkg')).toMatch('[success]')
})

test('resolve.extensions', async () => {
  expect(await page.textContent('.custom-ext')).toMatch('[success]')
})

test('resolve.mainFields', async () => {
  expect(await page.textContent('.custom-main-fields')).toMatch('[success]')
})

test('resolve.conditions', async () => {
  expect(await page.textContent('.custom-condition')).toMatch('[success]')
})

test('resolve package that contains # in path', async () => {
  expect(await page.textContent('.path-contains-sharp-symbol')).toMatch(
    '[success]'
  )
})
