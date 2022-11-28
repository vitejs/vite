import { expect, test } from 'vitest'
import { isBuild, page } from '~utils'

test('should render', async () => {
  const expected = isBuild
    ? /assets\/asset-[\da-f]+\.png/
    : 'http://localhost/server-origin/test/assets/asset.png'

  expect(await page.getAttribute('img', 'src')).toMatch(expected)
  expect(await page.getAttribute('img:nth-child(2)', 'src')).toMatch(expected)
})
