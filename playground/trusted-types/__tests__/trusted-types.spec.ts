import { describe, expect, test } from 'vitest'
import {
  browserErrors,
  browserLogs,
  editFile,
  isServe,
  page,
  untilBrowserLogAfter,
} from '~utils'

describe.runIf(isServe)('trusted-types', () => {
  test('should connect without trusted types violations', async () => {
    // Wait for HMR connection to establish (with timeout)
    const maxWait = 5000
    const startTime = Date.now()
    while (
      !browserLogs.some((msg) => msg.includes('connected')) &&
      Date.now() - startTime < maxWait
    ) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Verify HMR connected successfully
    expect(browserLogs.some((msg) => msg.includes('connected'))).toBe(true)

    // Verify no Trusted Types violations occurred
    const trustedTypesErrors = browserErrors.filter(
      (error) =>
        error.message.includes('TrustedTypes') ||
        error.message.includes('trusted types') ||
        error.message.includes("requires 'TrustedScriptURL'"),
    )
    expect(trustedTypesErrors).toHaveLength(0)
  })

  test('should render initial content', async () => {
    expect(await page.textContent('.hmr-status')).toBe('initial')
  })

  test('should handle HMR update', async () => {
    await untilBrowserLogAfter(
      () =>
        editFile('main.js', (code) =>
          code.replace("'initial'", "'updated via HMR'"),
        ),
      ['[trusted-types] hot update accepted'],
    )
    expect(await page.textContent('.hmr-status')).toBe('updated via HMR')
  })
})
