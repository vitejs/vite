import { expect, test } from 'vitest'
import { isBuild, page } from '~utils'

if (isBuild) {
  test('should render', async () => {
    await expect.poll(() => page.textContent('.app')).toBe('hello')
    await expect
      .poll(() => page.textContent('.date-fns-locale'))
      .toBe('czerwca')
  })
} else {
  test('bundles locale barrel imports', async () => {
    const reloadPromise = page.waitForEvent('load')
    await expect
      .poll(() => page.textContent('body'))
      .toContain('Bundling in progress')
    await reloadPromise
    await expect.poll(() => page.textContent('.app')).toBe('hello')
    await expect
      .poll(() => page.textContent('.date-fns-locale'))
      .toBe('czerwca')
  })
}
