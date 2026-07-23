import { expect, test } from 'vitest'
import { isBundledDev, page } from '~utils'

test.skipIf(isBundledDev)('object hooks', async () => {
  expect(await page.textContent('#transform')).toMatch('ok')
})
