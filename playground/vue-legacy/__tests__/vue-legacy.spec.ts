import { getBg, untilUpdated } from '~utils'

test('vue legacy assets', async () => {
  untilUpdated(() => getBg('.container'), 'asset', true)
})
