import { describe, expect, test } from 'vitest'
import { findAssetFile, isBuild } from '~utils'

describe.runIf(isBuild)('css lib entry', () => {
  test('remove useless js sourcemap', async () => {
    expect(findAssetFile('linked.js.map', 'lib-entry', './')).toBe('')
  })
})
