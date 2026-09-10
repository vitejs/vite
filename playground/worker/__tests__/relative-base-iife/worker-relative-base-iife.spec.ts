import { expect, test } from 'vitest'
import { isBuild, isBundledDev, page } from '~utils'

test.skipIf(isBundledDev)('asset url', async () => {
  await expect
    .poll(() => page.textContent('.asset-url'))
    .toMatch(isBuild ? '/worker-assets/worker_asset-vite' : '/vite.svg')
})
