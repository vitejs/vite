import { expect, test, vi } from 'vitest'
import { browserLogs, isServe, page, serverLogs } from '~utils'

test('proxy-bypass', async () => {
  await vi.waitFor(() => {
    expect(browserLogs.join('\n')).toContain('status of 404 (Not Found)')
  })
})

test('async-proxy-bypass', async () => {
  const content = await page.frame('async-response').content()
  expect(content).toContain('Hello after 4 ms (async timeout)')
})

test.runIf(isServe)('async-proxy-bypass-with-error', async () => {
  await vi.waitFor(() => {
    expect(serverLogs.join('\n')).toContain('bypass error')
  })
})
