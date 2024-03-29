import { test } from 'vitest'
import { page } from '~utils'

test('basic', async () => {
  await page.getByText('hydrated: true').isVisible()
  await page.getByText('Count: 0').isVisible()
  await page.getByRole('button', { name: '+' }).click()
  await page.getByText('Count: 1').isVisible()
})
