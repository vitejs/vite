import { getBg, page } from '~utils'

test('vue legacy assets', async () => {
  const el = await page.$('.container')
  expect(await getBg(el)).not.toMatch('__VITE_ASSET__')
})
