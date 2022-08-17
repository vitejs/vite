import { test } from 'vitest'
import { getBg, untilUpdated } from '~utils'

test('vue legacy assets', async () => {
  await untilUpdated(() => getBg('.container'), 'assets/asset', true)
})
