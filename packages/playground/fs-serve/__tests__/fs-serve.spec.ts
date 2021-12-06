import { isBuild, mochaReset, mochaSetup } from '../../testUtils'

const json = require('../safe.json')
const stringified = JSON.stringify(json)

describe('fs-serve.spec.ts', () => {
  before(mochaSetup)
  after(mochaReset)

  before(async () => {
    // viteTestUrl is globally injected in scripts/jestPerTestSetup.ts
    await page.goto(viteTestUrl + '/src/')
  })

  if (!isBuild) {
    it('default import', async () => {
      expect(await page.textContent('.full')).toBe(stringified)
    })

    it('named import', async () => {
      expect(await page.textContent('.named')).toBe(json.msg)
    })

    it('safe fetch', async () => {
      expect(await page.textContent('.safe-fetch')).toMatch('KEY=safe')
      expect(await page.textContent('.safe-fetch-status')).toBe('200')
    })

    it('unsafe fetch', async () => {
      expect(await page.textContent('.unsafe-fetch')).toMatch('403 Restricted')
      expect(await page.textContent('.unsafe-fetch-status')).toBe('403')
    })

    it('safe fs fetch', async () => {
      expect(await page.textContent('.safe-fs-fetch')).toBe(stringified)
      expect(await page.textContent('.safe-fs-fetch-status')).toBe('200')
    })

    it('unsafe fs fetch', async () => {
      expect(await page.textContent('.unsafe-fs-fetch')).toBe('')
      expect(await page.textContent('.unsafe-fs-fetch-status')).toBe('403')
    })

    it('nested entry', async () => {
      expect(await page.textContent('.nested-entry')).toBe('foobar')
    })

    it('nested entry', async () => {
      expect(await page.textContent('.nested-entry')).toBe('foobar')
    })

    it('denied', async () => {
      expect(await page.textContent('.unsafe-dotenv')).toBe('404')
    })
  } else {
    it('dummy test to make jest happy', async () => {
      // Your test suite must contain at least one test.
    })
  }
})
