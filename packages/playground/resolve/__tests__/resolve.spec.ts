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

test('omitted index/*', async () => {
  expect(await page.textContent('.index')).toMatch('[success]')
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

test('plugin resolved virutal file', async () => {
  expect(await page.textContent('.virtual')).toMatch('[success]')
})

test('resolve inline package', async () => {
  expect(await page.textContent('.inline-pkg')).toMatch('[success]')
})
