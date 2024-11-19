import { expect, test } from 'vitest'
import { getColor, page, untilUpdated } from '~utils'

test('should have css applied on second dynamic import', async () => {
  await untilUpdated(() => page.textContent('.content'), 'Initial')
  await page.click('.b')

  await untilUpdated(() => page.textContent('.content'), 'Reference')
  expect(await getColor('.content')).toBe('red')
})
