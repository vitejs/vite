import { describe, expect, test } from 'vitest'
import { findAssetFile, isBuild } from '~utils'

describe.runIf(isBuild)('css files has same basename', () => {
  test('emit file name should consistent', () => {
    expect(findAssetFile('sub.css', 'same-file-name', '.')).toMatch('.sub1-sub')
    expect(findAssetFile('sub2.css', 'same-file-name', '.')).toMatch(
      '.sub2-sub',
    )
  })
})
