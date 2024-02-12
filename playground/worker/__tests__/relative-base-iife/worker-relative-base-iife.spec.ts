import { test } from 'vitest'
import { isBuild, page, untilUpdated } from '~utils'

test('asset url', async () => {
  await untilUpdated(
    () => page.textContent('.asset-url'),
    isBuild ? '/worker-assets/worker_asset-vite' : '/vite.svg',
    true,
  )
})
