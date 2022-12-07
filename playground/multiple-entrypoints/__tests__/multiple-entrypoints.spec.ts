import { expect, test } from 'vitest'
import { getColor, page, untilUpdated } from '~utils'

test.skip('should have css applied on second dynamic import', async () => {
  await untilUpdated(() => page.textContent('.content'), 'Initial', true)
  await page.click('.b')

  await untilUpdated(() => page.textContent('.content'), 'Reference', true)
  expect(await getColor('.content')).toBe('red')
})
