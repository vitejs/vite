import { beforeAll, describe, expect, test } from 'vitest'
import testJSON from '../../safe.json'
import { isServe, page, viteTestUrl } from '~utils'

const stringified = JSON.stringify(testJSON)

describe.runIf(isServe)('main', () => {
  beforeAll(async () => {
    const srcPrefix = viteTestUrl.endsWith('/') ? '' : '/'
    await page.goto(viteTestUrl + srcPrefix + 'src/', {
      // while networkidle is discouraged, we use here because we're not using playwright's retry-able assertions,
      // and refactoring the code below to manually retry would be harder to read.
      waitUntil: 'networkidle',
    })
  })

  test('default import', async () => {
    await expect.poll(() => page.textContent('.full')).toBe(stringified)
  })

  test('named import', async () => {
    await expect.poll(() => page.textContent('.named')).toBe(testJSON.msg)
  })

  test('safe fetch', async () => {
    expect(await page.textContent('.safe-fetch')).toMatch('KEY=safe')
    await expect.poll(() => page.textContent('.safe-fetch-status')).toBe('200')
  })

  test('safe fetch with query', async () => {
    expect(await page.textContent('.safe-fetch-query')).toMatch('KEY=safe')
    await expect
      .poll(() => page.textContent('.safe-fetch-query-status'))
      .toBe('200')
  })

  test('safe fetch with special characters', async () => {
    expect(
      await page.textContent('.safe-fetch-subdir-special-characters'),
    ).toMatch('KEY=safe')
    await expect
      .poll(() =>
        page.textContent('.safe-fetch-subdir-special-characters-status'),
      )
      .toBe('200')
  })

  test('unsafe fetch', async () => {
    expect(await page.textContent('.unsafe-fetch')).toMatch('403 Restricted')
    await expect
      .poll(() => page.textContent('.unsafe-fetch-status'))
      .toBe('403')
  })

  test('unsafe fetch with special characters (#8498)', async () => {
    await expect.poll(() => page.textContent('.unsafe-fetch-8498')).toBe('')
    await expect
      .poll(() => page.textContent('.unsafe-fetch-8498-status'))
      .toBe('404')
  })

  test('unsafe fetch with special characters 2 (#8498)', async () => {
    await expect.poll(() => page.textContent('.unsafe-fetch-8498-2')).toBe('')
    await expect
      .poll(() => page.textContent('.unsafe-fetch-8498-2-status'))
      .toBe('404')
  })

  test('safe fs fetch', async () => {
    await expect
      .poll(() => page.textContent('.safe-fs-fetch'))
      .toBe(stringified)
    await expect
      .poll(() => page.textContent('.safe-fs-fetch-status'))
      .toBe('200')
  })

  test('safe fs fetch', async () => {
    await expect
      .poll(() => page.textContent('.safe-fs-fetch-query'))
      .toBe(stringified)
    await expect
      .poll(() => page.textContent('.safe-fs-fetch-query-status'))
      .toBe('200')
  })

  test('safe fs fetch with special characters', async () => {
    await expect
      .poll(() => page.textContent('.safe-fs-fetch-special-characters'))
      .toBe(stringified)
    await expect
      .poll(() => page.textContent('.safe-fs-fetch-special-characters-status'))
      .toBe('200')
  })

  test('unsafe fs fetch', async () => {
    await expect.poll(() => page.textContent('.unsafe-fs-fetch')).toBe('')
    await expect
      .poll(() => page.textContent('.unsafe-fs-fetch-status'))
      .toBe('403')
  })

  test('unsafe fs fetch with special characters (#8498)', async () => {
    await expect.poll(() => page.textContent('.unsafe-fs-fetch-8498')).toBe('')
    await expect
      .poll(() => page.textContent('.unsafe-fs-fetch-8498-status'))
      .toBe('404')
  })

  test('unsafe fs fetch with special characters 2 (#8498)', async () => {
    await expect
      .poll(() => page.textContent('.unsafe-fs-fetch-8498-2'))
      .toBe('')
    await expect
      .poll(() => page.textContent('.unsafe-fs-fetch-8498-2-status'))
      .toBe('404')
  })

  test('nested entry', async () => {
    await expect.poll(() => page.textContent('.nested-entry')).toBe('foobar')
  })

  test('denied', async () => {
    await expect.poll(() => page.textContent('.unsafe-dotenv')).toBe('403')
  })

  test('denied EnV casing', async () => {
    // It is 403 in case insensitive system, 404 in others
    await expect
      .poll(() => page.textContent('.unsafe-dotEnV-casing'))
      .toStrictEqual(expect.toBeOneOf(['403', '404']))
  })
})

describe('fetch', () => {
  test('serve with configured headers', async () => {
    const res = await fetch(viteTestUrl + '/src/')
    expect(res.headers.get('x-served-by')).toBe('vite')
  })
})
