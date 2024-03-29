import { expect, test } from '@playwright/test'

test('basic', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#root')).toContainText('hydrated: true')
  await expect(page.locator('#root')).toContainText('Count: 0')
  await page.getByRole('button', { name: '+' }).click()
  await expect(page.locator('#root')).toContainText('Count: 1')
})
