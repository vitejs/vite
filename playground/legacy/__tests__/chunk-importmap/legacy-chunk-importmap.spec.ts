import { expect, test } from 'vitest'
import { browserLogs, isBundledDev } from '~utils'

test.skipIf(isBundledDev)('should have no 404s', () => {
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('404')
  })
})
