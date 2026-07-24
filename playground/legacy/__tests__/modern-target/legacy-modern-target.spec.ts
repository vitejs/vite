import { describe, expect, test } from 'vitest'
import { findAssetFile, isBuild, page, viteTestUrl } from '~utils'

test('should load and execute the JS file', async () => {
  await page.goto(viteTestUrl + '/modern-target.html')
  await expect.poll(() => page.textContent('#app')).toMatch('at: 3')
})

describe.runIf(isBuild)('build', () => {
  test('modern polyfill chunk respects modernTargets', () => {
    const polyfill = findAssetFile(/polyfills-[-\w]+\.js$/, 'modern-target')
    expect(polyfill).toBeTruthy()
    // `modernTargets` includes Chrome 64, which does not support optional catch binding.
    // `try {} catch (e) {}` must not be collapsed to `try {} catch {}`.
    expect(polyfill).toMatch(/catch\s*\(/)
    expect(polyfill).not.toMatch(/catch\s*\{/)
  })
})
