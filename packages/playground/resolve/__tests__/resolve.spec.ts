test('deep import', async () => {
  expect(await page.textContent('.deep-import')).toMatch('[2,4]')
})

test('entry with exports field', async () => {
  expect(await page.textContent('.exports-entry')).toMatch('[success]')
})

test('deep import with exports field', async () => {
  expect(await page.textContent('.exports-deep')).toMatch('[success]')
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
