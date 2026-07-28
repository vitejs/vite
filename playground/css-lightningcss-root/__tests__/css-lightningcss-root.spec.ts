import { expect, test } from 'vitest'
import { getBg, isBuild, isBundledDev, page, viteTestUrl } from '~utils'

test('url dependency', async () => {
  const css = await page.$('.url-dep')
  expect(await getBg(css)).toMatch(
    isBuild || isBundledDev ? /ok-[-\w]+\.png/ : `${viteTestUrl}/ok.png`,
  )
})
