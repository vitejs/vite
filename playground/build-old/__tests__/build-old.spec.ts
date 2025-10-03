import { describe, expect, test } from 'vitest'
import { findAssetFile, isBuild, page } from '~utils'

describe('syntax preserve', () => {
  test('import.meta.url', async () => {
    expect(await page.textContent('.import-meta-url')).toBe('string')
  })
  test('dynamic import', async () => {
    expect(await page.textContent('.dynamic-import')).toBe('success')
  })
})

describe('syntax is lowered', () => {
  test('private field', async () => {
    expect(await page.textContent('.private-field')).toBe('private')

    if (isBuild) {
      const content = findAssetFile(/index-[-\w]{8}\.js/)
      expect(content).not.toMatch(/this\.#\w+/)
    }
  })
})
