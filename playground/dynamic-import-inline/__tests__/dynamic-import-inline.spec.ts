import { expect, test } from 'vitest'
import { isBuild, serverLogs } from '~utils'

test.runIf(isBuild)(
  "don't warn when codeSplitting is set to false",
  async () => {
    const log = serverLogs.join('\n')
    expect(log).not.toContain(
      'dynamic import will not move module into another chunk',
    )
  },
)
