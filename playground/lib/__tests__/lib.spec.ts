import { isBuild, isServe, testDir, untilUpdated } from '../../testUtils'
import path from 'path'
import fs from 'fs'

describe.runIf(isBuild)('build', () => {
  test('es', async () => {
    expect(await page.textContent('.es')).toBe('It works')
  })

  test('umd', async () => {
    expect(await page.textContent('.umd')).toBe('It works')
    const code = fs.readFileSync(
      path.join(testDir(), 'dist/my-lib-custom-filename.umd.js'),
      'utf-8'
    )
    // esbuild helpers are injected inside of the UMD wrapper
    expect(code).toMatch(/^\(function\(/)
  })

  test('iife', async () => {
    expect(await page.textContent('.iife')).toBe('It works')
    const code = fs.readFileSync(
      path.join(testDir(), 'dist/my-lib-custom-filename.iife.js'),
      'utf-8'
    )
    // esbuild helpers are injected inside of the IIFE wrapper
    expect(code).toMatch(/^var MyLib=function\(\){"use strict";/)
  })

  test('Library mode does not include `preload`', async () => {
    await untilUpdated(
      () => page.textContent('.dynamic-import-message'),
      'hello vite'
    )
    const code = fs.readFileSync(
      path.join(testDir(), 'dist/lib/dynamic-import-message.js'),
      'utf-8'
    )
    expect(code).not.toMatch('__vitePreload')
  })

  test('@import hoist', async () => {
    serverLogs.forEach((log) => {
      // no warning from esbuild css minifier
      expect(log).not.toMatch('All "@import" rules must come first')
    })
  })
})

test.runIf(isServe)('dev', async () => {
  expect(await page.textContent('.demo')).toBe('It works')
})
