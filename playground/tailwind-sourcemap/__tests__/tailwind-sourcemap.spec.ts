import { expect, test } from 'vitest'
import { isBuild, serverLogs } from '~utils'

test.runIf(!isBuild)('should not output missing source file warning', () => {
  serverLogs.forEach((log) => {
    expect(log).not.toMatch(/Sourcemap for .+ points to missing source files/)
  })
})

test.runIf(isBuild)('should not output sourcemap warning (#4939)', () => {
  serverLogs.forEach((log) => {
    expect(log).not.toMatch('Sourcemap is likely to be incorrect')
  })
})
