const json = require('../test.json')

test('default import', async () => {
  expect(await page.textContent('.full')).toBe(JSON.stringify(json, null, 2))
})

test('named import', async () => {
  expect(await page.textContent('.named')).toBe(json.hello)
})
