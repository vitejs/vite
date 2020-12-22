test('string', async () => {
  const defines = require('../vite.config.js').define

  expect(await page.textContent('.string')).toBe(String(defines.__STRING__))
  expect(await page.textContent('.number')).toBe(String(defines.__NUMBER__))
  expect(await page.textContent('.boolean')).toBe(String(defines.__BOOLEAN__))
  expect(await page.textContent('.object')).toBe(
    JSON.stringify(defines.__OBJ__, null, 2)
  )
})
