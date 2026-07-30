import { describe, expect, test } from 'vitest'
import { assetUrlRE } from '../../plugins/asset'

describe('wasm plugin assetUrlRE usage', () => {
  // Regression test: assetUrlRE has the /g flag, which makes .test()
  // stateful via lastIndex. When the wasm plugin called assetUrlRE.test()
  // on consecutive asset URLs without resetting lastIndex, the second call
  // would fail because lastIndex was already past the end of the string.
  // This caused a non-deterministic bug where ~half of wasm files would
  // miss the __VITE_ASSET__ -> __VITE_WASM_INIT__ replacement in SSR
  // builds, leading to ENOENT errors at runtime.
  test('assetUrlRE.test() fails on second call without lastIndex reset', () => {
    const url1 = '__VITE_ASSET__abc123__'
    const url2 = '__VITE_ASSET__def456__'

    // Simulate the bug: two consecutive .test() calls without resetting lastIndex
    assetUrlRE.lastIndex = 0
    expect(assetUrlRE.test(url1)).toBe(true)
    // After the first successful match, lastIndex is advanced past the string
    expect(assetUrlRE.lastIndex).toBeGreaterThan(0)
    // The second call fails because lastIndex > url2.length
    expect(assetUrlRE.test(url2)).toBe(false)

    // Clean up
    assetUrlRE.lastIndex = 0
  })

  test('assetUrlRE.test() succeeds on consecutive calls with lastIndex reset', () => {
    const url1 = '__VITE_ASSET__abc123__'
    const url2 = '__VITE_ASSET__def456__'

    assetUrlRE.lastIndex = 0
    expect(assetUrlRE.test(url1)).toBe(true)

    // The fix: reset lastIndex before the next call
    assetUrlRE.lastIndex = 0
    expect(assetUrlRE.test(url2)).toBe(true)

    // Clean up
    assetUrlRE.lastIndex = 0
  })
})
