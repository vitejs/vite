import { describe, expect, test } from 'vitest'
import { page } from '~utils'

describe('Check if build is successful', () => {
  test('Check if page is rendered', async () => {
    expect(await page.textContent('.base-info')).toBe('should be red')
  })
})
