import { expect, test } from 'vitest'
import { getBg, isBuild, page, viteTestUrl } from '~utils'

test('url dependency', async () => {
  const css = await page.$('.url-dep')
  expect(await getBg(css)).toMatch(
    isBuild ? /ok-[-\w]+\.png/ : `${viteTestUrl}/ok.png`,
  )
})
