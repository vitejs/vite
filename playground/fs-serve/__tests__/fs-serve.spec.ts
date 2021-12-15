import { isBuild } from '../../testUtils'

const json = require('../safe.json')
const stringified = JSON.stringify(json)

describe('main', () => {
  beforeAll(async () => {
    // viteTestUrl is globally injected in scripts/jestPerTestSetup.ts
    await page.goto(viteTestUrl + '/src/')
  })

  if (!isBuild) {
    test('default import', async () => {
      expect(await page.textContent('.full')).toBe(stringified)
    })

    test('named import', async () => {
      expect(await page.textContent('.named')).toBe(json.msg)
    })

    test('safe fetch', async () => {
      expect(await page.textContent('.safe-fetch')).toMatch('KEY=safe')
      expect(await page.textContent('.safe-fetch-status')).toBe('200')
    })

    test('unsafe fetch', async () => {
      expect(await page.textContent('.unsafe-fetch')).toMatch('403 Restricted')
      expect(await page.textContent('.unsafe-fetch-status')).toBe('403')
    })

    test('safe fs fetch', async () => {
      expect(await page.textContent('.safe-fs-fetch')).toBe(stringified)
      expect(await page.textContent('.safe-fs-fetch-status')).toBe('200')
    })

    test('unsafe fs fetch', async () => {
      expect(await page.textContent('.unsafe-fs-fetch')).toBe('')
      expect(await page.textContent('.unsafe-fs-fetch-status')).toBe('403')
    })

    test('nested entry', async () => {
      expect(await page.textContent('.nested-entry')).toBe('foobar')
    })

    test('nested entry', async () => {
      expect(await page.textContent('.nested-entry')).toBe('foobar')
    })

    test('denied', async () => {
      expect(await page.textContent('.unsafe-dotenv')).toBe('404')
    })
  } else {
    test('dummy test to make jest happy', async () => {
      // Your test suite must contain at least one test.
    })
  }
})
