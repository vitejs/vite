import { describe, expect, test } from 'vitest'
import { findAssetFile, isBuild, page, viteTestUrl } from '~utils'

test('should load and execute the JS file', async () => {
  await page.goto(viteTestUrl + '/exclude-polyfills.html')
  await expect
    .poll(() => page.textContent('#app'))
    .toMatch('sorted: 1,2,3, odd: 1,3')
})

describe.runIf(isBuild)('build', () => {
  test('excludes polyfills from the modern polyfill chunk', () => {
    const polyfill = findAssetFile(
      /polyfills-(?!legacy)[-\w]+\.js$/,
      'exclude-polyfills',
    )
    expect(polyfill).toMatch('core-js/modules/es.array.to-sorted.js')
    expect(polyfill).not.toMatch('core-js/modules/es.object.group-by.js')
  })

  test('excludes polyfills from the legacy polyfill chunk', () => {
    const polyfill = findAssetFile(
      /polyfills-legacy-[-\w]+\.js$/,
      'exclude-polyfills',
    )
    expect(polyfill).toMatch('core-js/modules/es.object.group-by.js')
    expect(polyfill).not.toMatch(/core-js\/modules\/[\w.-]+\.to-sorted\.js/)
  })
})
