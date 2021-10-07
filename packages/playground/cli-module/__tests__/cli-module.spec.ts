import { port } from './serve'

test('cli should work in "type":"module" package', async () => {
  // this test uses a custom serve implementation, so regular helpers for browserLogs and goto don't work
  // do the same thing manually
  const logs = []
  const onConsole = (msg) => {
    logs.push(msg.text())
  }
  try {
    page.on('console', onConsole)
    await page.goto(`http://localhost:${port}/`)
    expect(await page.textContent('.app')).toBe(
      'vite cli in "type":"module" package works!'
    )
    expect(
      logs.some((msg) =>
        msg.match('vite cli in "type":"module" package works!')
      )
    ).toBe(true)
  } finally {
    page.off('console', onConsole)
  }
})
