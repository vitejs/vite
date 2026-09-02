import { expect, test } from 'vitest'
import { isServe, page } from '~utils'

test.runIf(isServe)('lazy bundling respects configured base', async () => {
  await expect.poll(() => page.textContent('h1')).toBe('HMR Full Bundle Mode')

  const lazyResponsePromise = page.waitForResponse((response) => {
    return new URL(response.url()).pathname.endsWith('/@vite/lazy')
  })
  await page.click('#load-dynamic')

  const lazyResponse = await lazyResponsePromise
  expect(new URL(lazyResponse.url()).pathname).toBe('/nested-base/@vite/lazy')
  expect(lazyResponse.status()).toBe(200)
  await expect.poll(() => page.textContent('.dynamic')).toBe('loaded')
})
