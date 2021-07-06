import { getColor } from '../../testUtils'

test('postcss config', async () => {
  const a = await page.$('.postcss-a')
  expect(await getColor(a)).toBe('blue')
  const b = await page.$('.postcss-b')
  expect(await getColor(b)).toBe('black')
})
