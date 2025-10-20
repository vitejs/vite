import { describe, expect, test } from 'vitest'
import { findAssetFile, isBuild, page } from '~utils'

describe('syntax preserve', () => {
  test('import.meta.url', async () => {
    await expect.poll(() => page.textContent('.import-meta-url')).toBe('string')
  })
  test('dynamic import', async () => {
    await expect.poll(() => page.textContent('.dynamic-import')).toBe('success')
  })
})

describe('syntax is lowered', () => {
  test('private field', async () => {
    await expect.poll(() => page.textContent('.private-field')).toBe('private')

    if (isBuild) {
      const content = findAssetFile(/index-[-\w]{8}\.js/)
      expect(content).not.toMatch(/this\.#\w+/)
    }
  })
})
