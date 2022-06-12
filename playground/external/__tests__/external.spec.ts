import { page } from '~utils'

test('external', async () => {
  expect(await page.textContent('.external')).toBe('vite')
})
