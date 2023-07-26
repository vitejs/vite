import { describe, expect, test } from 'vitest'
import { findAssetFile, getColor, isBuild } from '~utils'

test('should load stylesheet', async () => {
  expect(await getColor('h1')).toBe('red')
})

describe.runIf(isBuild)('build', () => {
  test('should remove empty chunk', async () => {
    expect(findAssetFile('main.*.js$')).toMatch(`/* empty css`)
  })
})
