import { expect, test } from 'vitest'
import { port, streams } from './serve'
import { editFile, notContain, page, toContain, withRetry } from '~utils'

test('cli should work', async () => {
  // this test uses a custom serve implementation, so regular helpers for browserLogs and goto don't work
  // do the same thing manually
  const logs = []
  const onConsole = (msg) => {
    logs.push(msg.text())
  }
  try {
    page.on('console', onConsole)
    await page.goto(`http://localhost:${port}/`)

    expect(await page.textContent('.app')).toBe('vite cli works!')
    expect(logs.some((msg) => msg.match('vite cli works!'))).toBe(true)
  } finally {
    page.off('console', onConsole)
  }
})

test('should restart', async () => {
  editFile('./vite.config.js', (content) => content)
  await withRetry(async () => {
    toContain(streams.server.out, 'server restarted')
    notContain(streams.server.out, 'error')
  })
})
