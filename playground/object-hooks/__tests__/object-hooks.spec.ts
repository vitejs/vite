import { expect, test } from 'vitest'
import { page } from '~utils'

test('object hooks', async () => {
  expect(await page.textContent('#transform')).toMatch('ok')
})
