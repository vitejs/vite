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
    expect(await page.textContent('.safe-fetch-status')).toBe('200')
  })

  test('unsafe fetch', async () => {
    expect(await page.textContent('.unsafe-fetch')).toBe('')
    expect(await page.textContent('.unsafe-fetch-status')).toBe('403')
  })

  test('nested entry', async () => {
    expect(await page.textContent('.nested-entry')).toBe('foobar')
  })
} else {
  test('dummy test to make jest happy', async () => {
    // Your test suite must contain at least one test.
  })
}
