import { expect, test, vi } from 'vitest'
import { browserLogs } from '~utils'

test('proxy-bypass', async () => {
  await vi.waitFor(() => {
    expect(browserLogs.join('\n')).toContain('status of 404 (Not Found)')
  })
})
