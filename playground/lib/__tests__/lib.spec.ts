import { describe, expect, test } from 'vitest'
import {
  isBuild,
  isServe,
  page,
  readFile,
  serverLogs,
  untilUpdated,
  withRetry,
} from '~utils'

describe.runIf(isBuild)('build', () => {
  test('es', async () => {
    expect(await page.textContent('.es')).toBe('It works')
  })

  test('umd', async () => {
    expect(await page.textContent('.umd')).toBe('It works')
    const code = readFile('dist/my-lib-custom-filename.umd.cjs')
    const noMinifyCode = readFile(
      'dist/nominify/my-lib-custom-filename.umd.cjs',
    )
    const namedCode = readFile('dist/named/my-lib-named.umd.cjs')
    // esbuild helpers are injected inside of the UMD wrapper
    expect(code).toMatch(/^\(function\(/)
    expect(noMinifyCode).toMatch(
      /^\(function\(global.+?"use strict";var.+?function\smyLib\(/s,
    )
    expect(namedCode).toMatch(/^\(function\(/)
  })

  test('iife', async () => {
    expect(await page.textContent('.iife')).toBe('It works')
    const code = readFile('dist/my-lib-custom-filename.iife.js')
    const noMinifyCode = readFile(
      'dist/nominify/my-lib-custom-filename.iife.js',
    )
    const namedCode = readFile('dist/named/my-lib-named.iife.js')
    // esbuild helpers are injected inside of the IIFE wrapper
    expect(code).toMatch(/^var MyLib=function\(\)\{\s*"use strict";/)
    expect(noMinifyCode).toMatch(
      /^var MyLib\s*=\s*function\(\)\s*\{\s*"use strict";/,
    )
    expect(namedCode).toMatch(
      /^var MyLibNamed=function\([^()]+\)\{\s*"use strict";/,
    )
  })

  test('restrisct-helpers-injection', async () => {
    const code = readFile(
      'dist/helpers-injection/my-lib-custom-filename.iife.js',
    )
    expect(code).toMatch(
      `'"use strict"; return (' + expressionSyntax + ").constructor;"`,
    )
  })

  test('Library mode does not include `preload`', async () => {
    await untilUpdated(
      () => page.textContent('.dynamic-import-message'),
      'hello vite',
    )
    const code = readFile('dist/lib/dynamic-import-message.es.mjs')
    expect(code).not.toMatch('__vitePreload')

    // Test that library chunks are hashed
    expect(code).toMatch(/await import\("\.\/message-[-\w]{8}.js"\)/)
  })

  test('Library mode does not have any reference to pure CSS chunks', async () => {
    const code = readFile('dist/lib/dynamic-import-message.es.mjs')

    // Does not import pure CSS chunks and replaced by `Promise.resolve({})` instead
    expect(code).not.toMatch(/await import\("\.\/dynamic-[-\w]{8}.js"\)/)
    expect(code).toMatch(/await Promise.resolve\(\{.*\}\)/)
  })

  test('@import hoist', async () => {
    serverLogs.forEach((log) => {
      // no warning from esbuild css minifier
      expect(log).not.toMatch('All "@import" rules must come first')
    })
  })

  test('preserve process.env', () => {
    const es = readFile('dist/my-lib-custom-filename.js')
    const iife = readFile('dist/my-lib-custom-filename.iife.js')
    const umd = readFile('dist/my-lib-custom-filename.umd.cjs')
    expect(es).toMatch('process.env.NODE_ENV')
    expect(iife).toMatch('process.env.NODE_ENV')
    expect(umd).toMatch('process.env.NODE_ENV')
  })

  test('single entry with css', () => {
    const css = readFile('dist/css-single-entry/test-my-lib.css')
    const js = readFile('dist/css-single-entry/test-my-lib.js')
    const umd = readFile('dist/css-single-entry/test-my-lib.umd.cjs')
    expect(css).toMatch('entry-1.css')
    expect(js).toMatch('css-entry-1')
    expect(umd).toContain('css-entry-1')
  })

  test('multi entry with css', () => {
    const css = readFile('dist/css-multi-entry/test-my-lib.css')
    const js1 = readFile('dist/css-multi-entry/css-entry-1.js')
    const js2 = readFile('dist/css-multi-entry/css-entry-2.js')
    const cjs1 = readFile('dist/css-multi-entry/css-entry-1.cjs')
    const cjs2 = readFile('dist/css-multi-entry/css-entry-2.cjs')
    expect(css).toMatch('entry-1.css')
    expect(css).toMatch('entry-2.css')
    expect(js1).toMatch('css-entry-1')
    expect(js2).toMatch('css-entry-2')
    expect(cjs1).toContain('css-entry-1')
    expect(cjs2).toContain('css-entry-2')
  })

  test('multi entry with css and code split', () => {
    const css1 = readFile('dist/css-code-split/css-entry-1.css')
    const css2 = readFile('dist/css-code-split/css-entry-2.css')
    const js1 = readFile('dist/css-code-split/css-entry-1.js')
    const js2 = readFile('dist/css-code-split/css-entry-2.js')
    const cjs1 = readFile('dist/css-code-split/css-entry-1.cjs')
    const cjs2 = readFile('dist/css-code-split/css-entry-2.cjs')
    expect(css1).toMatch('entry-1.css')
    expect(css2).toMatch('entry-2.css')
    expect(js1).toMatch('css-entry-1')
    expect(js2).toMatch('css-entry-2')
    expect(cjs1).toContain('css-entry-1')
    expect(cjs2).toContain('css-entry-2')
  })
})

test.runIf(isServe)('dev', async () => {
  await withRetry(async () => {
    expect(await page.textContent('.demo')).toBe('It works')
  })
})
