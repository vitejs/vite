import { expect, test, vi } from 'vitest'
import { browserLogs, isServe, page, serverLogs, viteTestUrl } from '~utils'

test('proxy-bypass', async () => {
  await vi.waitFor(() => {
    expect(browserLogs.join('\n')).toContain('status of 404 (Not Found)')
  })
})

test('async-proxy-bypass', async () => {
  const content = await page.frame('async-response').content()
  expect(content).toContain('Hello after 4 ms (async timeout)')
})

test('async-proxy-bypass-with-error', async () => {
  await vi.waitFor(() => {
    expect(serverLogs.join('\n')).toContain('bypass error')
  })
})

test.runIf(isServe)('proxy error returns 502', async () => {
  const res = await fetch(viteTestUrl + '/proxyError')
  expect(res.status).toBe(502)
})
