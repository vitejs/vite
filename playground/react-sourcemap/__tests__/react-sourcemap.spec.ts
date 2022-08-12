import { expect, test } from 'vitest'
import { isBuild, serverLogs } from '~utils'

test.runIf(isBuild)('should not output sourcemap warning', () => {
  serverLogs.forEach((log) => {
    expect(log).not.toMatch('Sourcemap is likely to be incorrect')
  })
})
