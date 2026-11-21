import { expect, test } from 'vitest'
import { isBuild, serverLogs } from '~utils'

test.runIf(isBuild)("don't warn when codeSplitting is set to false", () => {
  expect(serverLogs).not.toContainEqual(
    expect.stringContaining(
      'dynamic import will not move module into another chunk',
    ),
  )
})
