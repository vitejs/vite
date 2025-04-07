import { expect, test } from 'vitest'
import { port, serverLogs } from './serve'
import { browserLogs, editFile, isServe, page, withRetry } from '~utils'

const url = `http://localhost:${port}`

test(`circular dependencies modules doesn't throw`, async () => {
  await page.goto(`${url}/circular-dep`)

  expect(await page.textContent('.circ-dep-init')).toMatch(
    'circ-dep-init-a circ-dep-init-b',
  )
})

test(`circular import doesn't throw (1)`, async () => {
  await page.goto(`${url}/circular-import`)

  expect(await page.textContent('.circ-import')).toMatchInlineSnapshot(
    '"A is: __A__"',
  )
})

test(`circular import doesn't throw (2)`, async () => {
  await page.goto(`${url}/circular-import2`)

  expect(await page.textContent('.circ-import')).toMatchInlineSnapshot(
    '"A is: __A__"',
  )
})

test(`deadlock doesn't happen for static imports`, async () => {
  await page.goto(`${url}/forked-deadlock-static-imports`)

  expect(await page.textContent('.forked-deadlock-static-imports')).toMatch(
    'rendered',
  )
})

test(`deadlock doesn't happen for dynamic imports`, async () => {
  await page.goto(`${url}/forked-deadlock-dynamic-imports`)

  expect(await page.textContent('.forked-deadlock-dynamic-imports')).toMatch(
    'rendered',
  )
})

test.runIf(isServe)('html proxy is encoded', async () => {
  await page.goto(
    `${url}?%22%3E%3C/script%3E%3Cscript%3Econsole.log(%27html%20proxy%20is%20not%20encoded%27)%3C/script%3E`,
  )

  expect(browserLogs).not.toContain('html proxy is not encoded')
})

// run this at the end to reduce flakiness
test.runIf(isServe)('should restart ssr', async () => {
  editFile('./vite.config.ts', (content) => content)
  await withRetry(async () => {
    expect(serverLogs).toEqual(
      expect.arrayContaining([expect.stringMatching('server restarted')]),
    )
    expect(serverLogs).not.toEqual(
      expect.arrayContaining([expect.stringMatching('error')]),
    )
  })
})
