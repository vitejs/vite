const json = require('../test.json')
const stringified = JSON.stringify(json)

test('default import', async () => {
  expect(await page.textContent('.full')).toBe(stringified)
})

test('named import', async () => {
  expect(await page.textContent('.named')).toBe(json.hello)
})

test('dynamic import', async () => {
  expect(await page.textContent('.dynamic')).toBe(stringified)
})

test('dynamic import, named', async () => {
  expect(await page.textContent('.dynamic-named')).toBe(json.hello)
})

test('raw fetch', async () => {
  expect(await page.textContent('.fetch')).toBe(stringified)
})
