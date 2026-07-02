import { expect, test } from 'vitest'
import { browserLogs, page } from '~utils'

test('should have no 404s', () => {
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('404')
  })
})

test('not-preserve-symlinks', async () => {
  // Wait for the page to load fully before testing
  await page.waitForLoadState('networkidle')
  // Ensure the server is stable
  await page.waitForTimeout(500)
  expect(await page.textContent('#root')).toBe('hello vite')
})
