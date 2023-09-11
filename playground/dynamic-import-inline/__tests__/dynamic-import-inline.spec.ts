import { expect, test } from 'vitest'
import { isBuild, serverLogs } from '~utils'

test.runIf(isBuild)(
  'dont warn when inlineDynamicImports is set to true',
  async () => {
    const log = serverLogs.join('\n')
    expect(log).not.toContain(
      'dynamic import will not move module into another chunk',
    )
  },
)
