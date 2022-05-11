import testJSON from '../safe.json'
import { isServe, page, viteTestUrl } from '~utils'

const stringified = JSON.stringify(testJSON)

describe.runIf(isServe)('main', () => {
  beforeAll(async () => {
    await page.goto(viteTestUrl + '/src/')
  })

  test('default import', async () => {
    expect(await page.textContent('.full')).toBe(stringified)
  })

  test('named import', async () => {
    expect(await page.textContent('.named')).toBe(testJSON.msg)
  })

  test('safe fetch', async () => {
    expect(await page.textContent('.safe-fetch')).toMatch('KEY=safe')
    expect(await page.textContent('.safe-fetch-status')).toBe('200')
  })

  test('safe fetch with special characters', async () => {
    expect(
      await page.textContent('.safe-fetch-subdir-special-characters')
    ).toMatch('KEY=safe')
    expect(
      await page.textContent('.safe-fetch-subdir-special-characters-status')
    ).toBe('200')
  })

  test('unsafe fetch', async () => {
    expect(await page.textContent('.unsafe-fetch')).toMatch('403 Restricted')
    expect(await page.textContent('.unsafe-fetch-status')).toBe('403')
  })

  test('safe fs fetch', async () => {
    expect(await page.textContent('.safe-fs-fetch')).toBe(stringified)
    expect(await page.textContent('.safe-fs-fetch-status')).toBe('200')
  })

  test('safe fs fetch with special characters', async () => {
    expect(await page.textContent('.safe-fs-fetch-special-characters')).toBe(
      stringified
    )
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
})
