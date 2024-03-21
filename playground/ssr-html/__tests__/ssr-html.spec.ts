import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fetch from 'node-fetch'
import { describe, expect, test } from 'vitest'
import { port } from './serve'
import { editFile, isServe, page, untilUpdated } from '~utils'

const url = `http://localhost:${port}`

describe('injected inline scripts', () => {
  test('no injected inline scripts are present', async () => {
    await page.goto(url)
    const inlineScripts = await page.$$eval('script', (nodes) =>
      nodes.filter((n) => !n.getAttribute('src') && n.innerHTML),
    )
    expect(inlineScripts).toHaveLength(0)
  })

  test('injected script proxied correctly', async () => {
    await page.goto(url)
    const proxiedScripts = await page.$$eval('script', (nodes) =>
      nodes
        .filter((n) => {
          const src = n.getAttribute('src')
          if (!src) return false
          return src.includes('?html-proxy&index')
        })
        .map((n) => n.getAttribute('src')),
    )

    // assert at least 1 proxied script exists
    expect(proxiedScripts).not.toHaveLength(0)

    const scriptContents = await Promise.all(
      proxiedScripts.map((src) => fetch(url + src).then((res) => res.text())),
    )

    // all proxied scripts return code
    for (const code of scriptContents) {
      expect(code).toBeTruthy()
    }
  })
})

describe.runIf(isServe)('hmr', () => {
  test('handle virtual module updates', async () => {
    await page.goto(url)
    const el = await page.$('.virtual')
    expect(await el.textContent()).toBe('[success]')

    const loadPromise = page.waitForEvent('load')
    editFile('src/importedVirtual.js', (code) =>
      code.replace('[success]', '[wow]'),
    )
    await loadPromise

    await untilUpdated(async () => {
      const el = await page.$('.virtual')
      return await el.textContent()
    }, '[wow]')
  })
})

const execFileAsync = promisify(execFile)

describe.runIf(isServe)('stacktrace', () => {
  for (const ext of ['js', 'ts']) {
    for (const sourcemapsEnabled of [false, true]) {
      test(`stacktrace of ${ext} is correct when sourcemaps is${
        sourcemapsEnabled ? '' : ' not'
      } enabled in Node.js`, async () => {
        const testStacktraceFile = path.resolve(
          __dirname,
          '../test-stacktrace.js',
        )

        const p = await execFileAsync('node', [
          testStacktraceFile,
          '' + sourcemapsEnabled,
          ext,
        ])
        const lines = p.stdout
          .split('\n')
          .filter((line) => line.includes('Module.error'))

        const reg = new RegExp(
          path
            .resolve(__dirname, '../src', `error.${ext}`)
            .replace(/\\/g, '\\\\') + ':2:9',
          'i',
        )

        lines.forEach((line) => {
          expect(line.trim()).toMatch(reg)
        })
      })
    }
  }

  test('with Vite runtime', async () => {
    await execFileAsync('node', ['test-stacktrace-runtime.js'], {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
    })
  })
})

describe.runIf(isServe)('network-imports', () => {
  test('with Vite SSR', async () => {
    await execFileAsync(
      'node',
      ['--experimental-network-imports', 'test-network-imports.js'],
      {
        cwd: fileURLToPath(new URL('..', import.meta.url)),
      },
    )
  })

  test('with Vite runtime', async () => {
    await execFileAsync(
      'node',
      [
        '--experimental-network-imports',
        'test-network-imports.js',
        '--runtime',
      ],
      {
        cwd: fileURLToPath(new URL('..', import.meta.url)),
      },
    )
  })
})
