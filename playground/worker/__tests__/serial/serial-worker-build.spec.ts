import { describe, test } from 'vitest'
import { isBuild, page, untilUpdated } from '~utils'

describe.runIf(isBuild)('build', () => {
  test('expect the plugin state to be polluted and not match across worker builds', async () => {
    await untilUpdated(
      () => page.textContent('.nested-worker-plugin-state'),
      '"data":1',
      true,
    )
    // The plugin state is polluted and should have a different data value from the sub worker
    await untilUpdated(
      () => page.textContent('.sub-worker-plugin-state'),
      '"data":2',
      true,
    )
  })
})
