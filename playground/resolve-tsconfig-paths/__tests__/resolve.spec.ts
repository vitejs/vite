import { expect, test } from 'vitest'
import { page } from '~utils'

test('import from .ts', async () => {
  await expect.poll(() => page.textContent('.ts')).toMatch('[success]')
})

test('import from .js', async () => {
  await expect.poll(() => page.textContent('.js')).toMatch('[success]')
})

test('fallback works', async () => {
  await expect.poll(() => page.textContent('.fallback')).toMatch('[success]')
})
