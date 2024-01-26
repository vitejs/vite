import { beforeEach, describe, expect, test } from 'vitest'
import { findAssetFile, isBuild, startDefaultServe } from '~utils'

beforeEach(async () => {
  await startDefaultServe()
})

for (let i = 0; i < 5; i++) {
  describe.runIf(isBuild)('css files has same basename', () => {
    test('emit file name should consistent', () => {
      expect(findAssetFile('sub.css', 'same-file-name', '.')).toMatch(
        '.sub1-sub',
      )
      expect(findAssetFile('sub2.css', 'same-file-name', '.')).toMatch(
        '.sub2-sub',
      )
    })
  })
}
