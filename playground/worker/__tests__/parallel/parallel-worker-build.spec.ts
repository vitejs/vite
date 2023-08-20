import { describe, test } from 'vitest'
import { isBuild, page, untilUpdated } from '~utils'

test('deeply nested workers', async () => {
  await untilUpdated(
    async () => page.textContent('.deeply-nested-worker'),
    /Hello\sfrom\sroot.*\/parallel\/.+deeply-nested-worker\.js/,
    true,
  )
  await untilUpdated(
    async () => page.textContent('.deeply-nested-second-worker'),
    /Hello\sfrom\ssecond.*\/parallel\/.+second-worker\.js/,
    true,
  )
  await untilUpdated(
    async () => page.textContent('.deeply-nested-third-worker'),
    /Hello\sfrom\sthird.*\/parallel\/.+third-worker\.js/,
    true,
  )
})

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
