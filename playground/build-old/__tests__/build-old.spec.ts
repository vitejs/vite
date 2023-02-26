import { describe, expect, test } from 'vitest'
import { page } from '~utils'

describe('syntax preserve', () => {
  test('import.meta.url', async () => {
    expect(await page.textContent('.import-meta-url')).toBe('string')
  })
  test('dynamic import', async () => {
    expect(await page.textContent('.dynamic-import')).toBe('success')
  })
})
