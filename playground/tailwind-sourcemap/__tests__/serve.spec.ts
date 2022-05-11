import { isBuild, serverLogs } from '~utils'

test.runIf(isBuild)('should not output missing source file warning', () => {
  serverLogs.forEach((log) => {
    expect(log).not.toMatch(/Sourcemap for .+ points to missing source files/)
  })
})
