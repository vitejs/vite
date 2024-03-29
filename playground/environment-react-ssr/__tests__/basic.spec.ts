import { test } from 'vitest'
import { expect } from '@playwright/test'
import { page } from '~utils'

test('basic', async () => {
  await page.pause()
  await expect(page.locator('#root')).toContainText('hydrated: true')
  await expect(page.locator('#root')).toContainText('Count: 0')
  await page.getByRole('button', { name: '+' }).click()
  await expect(page.locator('#root')).toContainText('Count: 1')
})
