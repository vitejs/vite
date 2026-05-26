import { expect, test } from 'vitest'
import { page } from '~utils'

test('custom configFile is honored over auto-discovered tsconfig.json', async () => {
  await expect.poll(() => page.textContent('.custom')).toMatch('[success]')
})
