import './tests'
import { expect, test } from 'vitest'
import { findAssetFile, isBuild } from '~utils'

test.runIf(isBuild)(
  'keeps CSS layer order statements across imported files',
  () => {
    const cssFile = findAssetFile(/index-[-\w]+\.css$/)
    expect(cssFile).toContain(
      '@layer layer-order-base,layer-order-reset,layer-order-utilities;',
    )
  },
)
