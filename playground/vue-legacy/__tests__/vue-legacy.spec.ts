import { test } from 'vitest'
import { untilUpdated } from '~utils'

test('vue legacy assets', async () => {
  untilUpdated(() => '.container', 'asset', true)
})
