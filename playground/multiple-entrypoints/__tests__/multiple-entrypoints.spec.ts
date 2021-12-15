import { getColor, untilUpdated } from '../../testUtils'

test('should have css applied on second dynamic import', async () => {
  await untilUpdated(() => page.textContent('.content'), 'Initial', true)
  await page.click('.b')

  await untilUpdated(() => page.textContent('.content'), 'Reference', true)
  expect(await getColor('.content')).toBe('red')
})
