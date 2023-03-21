import { beforeEach, describe, expect, test } from 'vitest'
import { findAssetFile, isBuild, startDefaultServe } from '~utils'

beforeEach(async () => {
  await startDefaultServe()
})

for (let i = 0; i < 5; i++) {
  describe.runIf(isBuild)('css-codesplit build', () => {
    test('should be consistent with same content', () => {
      expect(findAssetFile(/style-.+\.css/)).toMatch('h2{color:#00f}')
      expect(findAssetFile(/style2-.+\.css/)).toBe('')
    })
  })
}
