import { test } from 'vitest'
import { getBg, untilUpdated } from '~utils'

test('vue legacy assets', async () => {
  await untilUpdated(() => getBg('.main'), 'assets/asset', true)
})

test('async vue legacy assets', async () => {
  await untilUpdated(() => getBg('.module'), 'assets/asset', true)
})
