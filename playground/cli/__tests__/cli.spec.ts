import { expect, test } from 'vitest'
import { port, streams } from './serve'
import { editFile, page, withRetry } from '~utils'

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
  const logsLengthBeforeEdit = streams.server.out.length
  editFile('./vite.config.js', (content) => content)
  await withRetry(async () => {
    const logs = streams.server.out.slice(logsLengthBeforeEdit)
    expect(logs).toEqual(
      expect.arrayContaining([expect.stringMatching('server restarted')]),
    )
    // Don't reprint the server URLs as they are the same
    expect(logs).not.toEqual(
      expect.arrayContaining([expect.stringMatching('http://localhost')]),
    )
    expect(logs).not.toEqual(
      expect.arrayContaining([expect.stringMatching('error')]),
    )
  })
})
