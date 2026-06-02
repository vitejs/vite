import { expect, test } from 'vitest'
import { isBuild, page } from '~utils'

test('asset url', async () => {
  await expect
    .poll(() => page.textContent('.asset-url'))
    .toMatch(isBuild ? '/worker-assets/worker_asset-vite' : '/vite.svg')
})
