import { stripVTControlCharacters } from 'node:util'
import { expect, test } from 'vitest'
import { isServe, page, serverLogs } from '~utils'

function normalizeLogs(logs: string[]) {
  return logs
    .map((log) => stripVTControlCharacters(log))
    .join('\n')
    .replaceAll(/ +\n/g, '\n') // strip trailing spaces
}

test.runIf(isServe)('unhandled error', async () => {
  await page.click('#test-error')
  await expect.poll(() => normalizeLogs(serverLogs)).toContain(`\
[Unhandled error] Error: this is test error
 > testError src/main.ts:30:8
    28 |
    29 |  function testError() {
    30 |    throw new Error('this is test error')
       |          ^
    31 |  }
    32 |
 > HTMLButtonElement.<anonymous> src/main.ts:8:2
`)
})

test.runIf(isServe)('unhandled rejection', async () => {
  const logIndex = serverLogs.length
  await page.click('#test-unhandledrejection')
  await expect.poll(() => normalizeLogs(serverLogs.slice(logIndex)))
    .toContain(`\
[Unhandled rejection] Error: this is test unhandledrejection
 > testUnhandledRejection src/main.ts:34:17
    32 |
    33 |  function testUnhandledRejection() {
    34 |    Promise.reject(new Error('this is test unhandledrejection'))
       |                   ^
    35 |  }
    36 |
 > HTMLButtonElement.<anonymous> src/main.ts:14:4
`)
})

test.runIf(isServe)('console.error', async () => {
  const logIndex = serverLogs.length
  await page.click('#test-console-error')
  await expect
    .poll(() => normalizeLogs(serverLogs.slice(logIndex)))
    .toContain(`[console.error] this is test console error`)
})

test.runIf(isServe)('dependency stack uses source map path', async () => {
  const logIndex = serverLogs.length
  await page.click('#test-dep-error')
  // TODO: test stack
  await expect.poll(() => normalizeLogs(serverLogs.slice(logIndex)))
    .toContain(`\
[Unhandled error] Error: this is test dependency error
`)
})
