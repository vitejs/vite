import { editFile, isBuild, readFile, untilUpdated } from '../../testUtils'

test('should log 500 error in browser for malformed tsconfig', () => {
  // don't test for actual complete message as this might be locale dependant. chrome does log 500 consistently though
  expect(browserLogs.find((x) => x.includes('500'))).toBeTruthy()
  expect(browserLogs).not.toContain('tsconfig error fixed, file loaded')
})

if (isBuild) {
  test('should not output files to dist', () => {
    let err
    try {
      readFile('dist/index.html')
    } catch (e) {
      err = e
    }
    expect(err).toBeTruthy()
    expect(err.code).toBe('ENOENT')
  })
} else {
  test('should show error overlay for tsconfig error', async () => {
    const errorOverlay = await page.waitForSelector('vite-error-overlay')
    expect(errorOverlay).toBeTruthy()
    const message = await errorOverlay.$$eval('.message-body', (m) => {
      return m[0].innerHTML
    })
    expect(message).toContain(
      'tsconfig-json-load-error/has-error/tsconfig.json failed: SyntaxError: Unexpected token } in JSON at position 107'
    )
  })
  test('should reload when tsconfig is changed', async () => {
    await editFile('has-error/tsconfig.json', (content) => {
      return content.replace('"compilerOptions":', '"compilerOptions":{}')
    })
    await untilUpdated(() => {
      return browserLogs.find((x) => x === 'tsconfig error fixed, file loaded')
    }, 'tsconfig error fixed, file loaded')
  })
}
