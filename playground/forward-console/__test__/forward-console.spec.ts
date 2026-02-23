import { stripVTControlCharacters } from 'node:util'
import { expect, test } from 'vitest'
import { isServe, page, serverLogs } from '~utils'

test.runIf(isServe)('unhandled error', async () => {
  await page.click('#test-error')
  await expect.poll(() => stripVTControlCharacters(serverLogs.at(-1)))
    .toEqual(`\
[Unhandled error] Error: this is test error
 > testError src/main.ts:20:8
    18 |  
    19 |  function testError() {
    20 |    throw new Error('this is test error')
       |          ^
    21 |  }
    22 |  
 > HTMLButtonElement.<anonymous> src/main.ts:6:2
`)
})

test.runIf(isServe)('unhandled rejection', async () => {
  await page.click('#test-unhandledrejection')
  await expect.poll(() => stripVTControlCharacters(serverLogs.at(-1)))
    .toEqual(`\
[Unhandled error] Error: this is test unhandledrejection
 > testUnhandledRejection src/main.ts:24:8
    22 |  
    23 |  async function testUnhandledRejection() {
    24 |    throw new Error('this is test unhandledrejection')
       |          ^
    25 |  }
    26 |  
 > HTMLButtonElement.<anonymous> src/main.ts:12:4
`)
})
