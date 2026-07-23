import { describe, expect, test } from 'vitest'
import { getColor, isBuild, isBundledDev, listAssets } from '~utils'

test.skipIf(isBundledDev)('should load all stylesheets', async () => {
  expect(await getColor('.shared-linked')).toBe('blue')
  await expect.poll(() => getColor('.async-js')).toBe('blue')
})

describe.runIf(isBuild)('build', () => {
  test('should remove empty chunk', async () => {
    const assets = listAssets()
    expect(assets).not.toContainEqual(
      expect.stringMatching(/shared-linked-.*\.js$/),
    )
    expect(assets).not.toContainEqual(expect.stringMatching(/async-js-.*\.js$/))
  })
})
