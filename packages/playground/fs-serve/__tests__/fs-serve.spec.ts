import { isBuild } from '../../testUtils'

const json = require('../safe.json')
const stringified = JSON.stringify(json)

if (!isBuild) {
  test('default import', async () => {
    expect(await page.textContent('.full')).toBe(stringified)
  })

  test('named import', async () => {
    expect(await page.textContent('.named')).toBe(json.msg)
  })

  test('safe fetch', async () => {
    expect(await page.textContent('.safe-fetch')).toBe(stringified)
  })

  test('unsafe fetch', async () => {
    expect(await page.textContent('.unsafe-fetch')).toBe('')
  })
} else {
  test('dummy test to make jest happy', async () => {
    // Your test suite must contain at least one test.
  })
}
