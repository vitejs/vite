import { stripVTControlCharacters } from 'node:util'
import { expect, test } from 'vitest'
import { isServe, page, serverLogs } from '~utils'

test.runIf(isServe)('unhandled error', async () => {
  await page.click('#test-error')
  await expect.poll(() => stripVTControlCharacters(serverLogs.at(-1)))
    .toEqual(`\
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
  await expect
    .poll(() =>
      serverLogs
        .slice(logIndex)
        .some((log) =>
          stripVTControlCharacters(log).includes(
            '[Unhandled rejection] Error: this is test unhandledrejection',
          ),
        ),
    )
    .toBe(true)
})

test.runIf(isServe)('console.error', async () => {
  const logIndex = serverLogs.length
  await page.click('#test-console-error')
  await expect
    .poll(() =>
      serverLogs
        .slice(logIndex)
        .some((log) =>
          stripVTControlCharacters(log).includes(
            '[console.error] this is test console error',
          ),
        ),
    )
    .toBe(true)
})

test.runIf(isServe)('dependency stack uses source map path', async () => {
  const logIndex = serverLogs.length
  await page.click('#test-dep-error')
  await expect
    .poll(() =>
      serverLogs.slice(logIndex).find((log) => {
        const cleanLog = stripVTControlCharacters(log)
        return (
          cleanLog.includes(
            '[Unhandled error] Error: this is test dependency error',
          ) && cleanLog.includes('throw-dep/index.js')
        )
      }),
    )
    .toBeTruthy()
})
