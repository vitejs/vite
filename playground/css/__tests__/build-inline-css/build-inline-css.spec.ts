import { describe, expect, test } from 'vitest'
import { findAssetFile, isBuild } from '~utils'

describe.runIf(isBuild)('build inline css', () => {
  test('build inline css should be success', () => {
    expect(findAssetFile(/index\.js$/, 'build-inline-css')).toMatch(
      `<style>
	body {
		background: red;
	}
</style>`,
    )
  })
})
