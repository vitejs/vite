import { port } from './serve'
import { page } from '~utils'

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
