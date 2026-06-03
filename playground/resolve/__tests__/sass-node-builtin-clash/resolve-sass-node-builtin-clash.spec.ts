import { expect, test } from 'vitest'
import { findAssetFile, isBuild } from '~utils'

test.runIf(isBuild)('sass @use with node builtin name does not panic', () => {
  const css = findAssetFile(/entry/, 'sass-node-builtin-clash')
  expect(css).toContain('cursor:pointer')
})
