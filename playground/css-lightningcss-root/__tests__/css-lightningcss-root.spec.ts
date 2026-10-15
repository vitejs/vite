import { expect, test } from 'vitest'
import { getBg, isBundled, page, viteTestUrl } from '~utils'

test('url dependency', async () => {
  const css = await page.$('.url-dep')
  expect(await getBg(css)).toMatch(
    isBundled ? /ok-[-\w]+\.png/ : `${viteTestUrl}/ok.png`,
  )
})
