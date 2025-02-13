import { expect, test } from 'vitest'
import { findAssetFile, isBuild } from '~utils'

test.runIf(isBuild)('sass modern compiler build multiple entries', () => {
  expect(findAssetFile(/entry1/, 'sass-modern-compiler-build'))
    .toMatchInlineSnapshot(`
    ".entry1{color:red}
    "
  `)
  expect(findAssetFile(/entry2/, 'sass-modern-compiler-build'))
    .toMatchInlineSnapshot(`
    ".entry2{color:#00f}
    "
  `)
})
