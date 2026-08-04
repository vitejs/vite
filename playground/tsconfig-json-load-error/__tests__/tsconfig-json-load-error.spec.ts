import { describe, expect, test } from 'vitest'
import { clearServeError, serveError } from './serve'
import {
  browserLogs,
  editFile,
  isBuild,
  isBundledDev,
  isServe,
  page,
  readFile,
} from '~utils'

const tsconfigLoadErrorRE =
  /(\[TSCONFIG_ERROR\] )*Failed to load tsconfig|JSONError/

describe.runIf(isBuild)('build', () => {
  test('should throw an error on build', () => {
    expect(serveError).toBeTruthy()
    expect(serveError.message).toMatch(tsconfigLoadErrorRE)
    clearServeError() // got expected error, null it here so testsuite does not fail from rethrow in afterAll
  })

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
})

describe.runIf(isServe)('server', () => {
  test.runIf(!isBundledDev)(
    'should log 500 error in browser for malformed tsconfig',
    () => {
      // don't test for actual complete message as this might be locale dependent. chrome does log 500 consistently though
      expect(browserLogs.find((x) => x.includes('500'))).toBeTruthy()
      expect(browserLogs).not.toContain('tsconfig error fixed, file loaded')
    },
  )

  test.runIf(isBundledDev)(
    'should keep the fallback page for malformed tsconfig',
    async () => {
      // bundled dev does not request modules one by one, so nothing can
      // answer with 500. The first build failed, so the server keeps serving
      // the fallback page with status 200. The error shows up in the overlay
      // instead, which the next test checks.
      expect(
        await page.evaluate(
          () => (globalThis as any).__vite_is_fallback_page__,
        ),
      ).toBe(true)
      expect(browserLogs).not.toContain('tsconfig error fixed, file loaded')
    },
  )

  test('should show error overlay for tsconfig error', async () => {
    const errorOverlay = await page.waitForSelector('vite-error-overlay')
    expect(errorOverlay).toBeTruthy()
    const message = await errorOverlay.$$eval('.message-body', (m) => {
      return m[0].innerHTML
    })
    // use regex with variable filename and position values because they are different on win
    expect(message).toMatch(tsconfigLoadErrorRE)
  })

  // bundled dev: no rebuild after initial-build failure yet (vitejs/vite#23028, rolldown#9598)
  test.skipIf(isBundledDev)(
    'should reload when tsconfig is changed',
    async () => {
      editFile('has-error/tsconfig.json', (content) => {
        return content.replace('"compilerOptions":', '"compilerOptions":{}')
      })
      await expect
        .poll(() => browserLogs)
        .toContain('tsconfig error fixed, file loaded')
    },
  )
})
