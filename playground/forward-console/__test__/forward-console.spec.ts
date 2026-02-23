import { stripVTControlCharacters } from 'node:util'
import { expect, test } from 'vitest'
import { isServe, page, serverLogs } from '~utils'

test.runIf(isServe)('unhandled error', async () => {
  await page.click('#test-error')
  await expect.poll(() => stripVTControlCharacters(serverLogs.at(-1)))
    .toEqual(`\
[Unhandled error] Error: this is test error
 > testError src/main.ts:24:8
    22 |  
    23 |  function testError() {
    24 |    throw new Error('this is test error')
       |          ^
    25 |  }
    26 |  
 > HTMLButtonElement.<anonymous> src/main.ts:6:2
`)
})

test.runIf(isServe)('unhandled rejection', async () => {
  await page.click('#test-unhandledrejection')
  await expect.poll(() => stripVTControlCharacters(serverLogs.at(-1)))
    .toEqual(`\
[Unhandled error] Error: this is test unhandledrejection
 > testUnhandledRejection src/main.ts:28:8
    26 |  
    27 |  async function testUnhandledRejection() {
    28 |    throw new Error('this is test unhandledrejection')
       |          ^
    29 |  }
    30 |  
 > HTMLButtonElement.<anonymous> src/main.ts:12:4
`)
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
            '[Console error] this is test console error',
          ),
        ),
    )
    .toBe(true)
})
