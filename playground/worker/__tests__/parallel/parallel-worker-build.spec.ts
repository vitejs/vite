import { describe, test } from 'vitest'
import { isBuild, page, untilUpdated } from '~utils'

describe.runIf(isBuild)('build', () => {
  test('expect the plugin state to be unpolluted and match across worker builds', async () => {
    await untilUpdated(
      () => page.textContent('.nested-worker-plugin-state'),
      '"data":1',
      true,
    )
    await untilUpdated(
      () => page.textContent('.sub-worker-plugin-state'),
      '"data":1',
      true,
    )
  })
})
