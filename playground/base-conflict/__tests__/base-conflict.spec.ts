import { expect, test } from 'vitest'
import { page } from '~utils'

test('absolute imports keep base prefix', async () => {
  await expect.poll(() => page.textContent('.message')).toBe('absolute import')
})
