import { expect, test } from 'vitest'
import { port, serverLogs } from './serve'
import { editFile, notContain, page, toContain, withRetry } from '~utils'

const url = `http://localhost:${port}`

test(`circular dependencies modules doesn't throw`, async () => {
  await page.goto(`${url}/circular-dep`)

  expect(await page.textContent('.circ-dep-init')).toMatch(
    'circ-dep-init-a circ-dep-init-b',
  )
})

test(`deadlock doesn't happen`, async () => {
  await page.goto(`${url}/forked-deadlock`)

  expect(await page.textContent('.forked-deadlock')).toMatch('rendered')
})

test('should restart ssr', async () => {
  editFile('./vite.config.ts', (content) => content)
  await withRetry(async () => {
    toContain(serverLogs, 'server restarted')
    notContain(serverLogs, 'error')
  })
})
