import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { createServer } from '..'
import type { ViteDevServer } from '..'

// Regression tests for the bundled-dev "Bundling in progress" fallback page.
// The page inlines the whole HMR runtime (which contains non-ASCII
// characters) but declared no encoding, so browsers with a legacy fallback
// encoding (GBK on zh-locale systems) mis-decoded the inline module script,
// which then died with a SyntaxError and never reloaded the page.

let server: ViteDevServer
let fallbackBytes: Uint8Array
let fallbackUtf8: string

beforeAll(async () => {
  server = await createServer({
    configFile: false,
    root: path.join(import.meta.dirname, 'fixtures', 'bundled-dev-fallback'),
    logLevel: 'silent',
    experimental: { bundledDev: true },
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { port: 0, ws: false },
    plugins: [
      {
        name: 'hold-first-bundle',
        apply: 'serve',
        // keep the first bundle "in progress" so the document request is
        // deterministically answered with the fallback page
        async generateBundle() {
          await new Promise((resolve) => setTimeout(resolve, 1500))
        },
      },
    ],
  })
  await server.listen()
  const res = await fetch(server.resolvedUrls!.local[0]!)
  fallbackBytes = new Uint8Array(await res.arrayBuffer())
  fallbackUtf8 = new TextDecoder('utf-8').decode(fallbackBytes)
})

afterAll(async () => {
  await server?.close()
})

function extractInlineModule(html: string): string {
  const match = html.match(/<script type="module">([\s\S]*?)<\/script>/)
  expect(match, 'fallback page should inline the HMR runtime').toBeTruthy()
  return match![1]!
}

function jsSyntaxError(source: string): string | null {
  const file = path.join(os.tmpdir(), `vite-fallback-check-${process.pid}.mjs`)
  fs.writeFileSync(file, source)
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' })
    return null
  } catch (e) {
    return String((e as { stderr: Buffer }).stderr).split('\n')[0]!
  } finally {
    fs.rmSync(file, { force: true })
  }
}

test('serves a fallback page while the initial bundle is running', () => {
  expect(fallbackUtf8).toContain('Bundling in progress')
  expect(fallbackUtf8).toContain('__vite_is_fallback_page__')
})

test('fallback page declares utf-8, and the inlined runtime is valid JS as utf-8', () => {
  // without an explicit charset, browsers with a legacy fallback encoding
  // mis-decode this page (see the next test)
  expect(fallbackUtf8).toContain('<meta charset="utf-8"')
  const script = extractInlineModule(fallbackUtf8)
  expect(jsSyntaxError(script)).toBeNull()
})

test('the charset declaration is load-bearing: legacy decoding corrupts the runtime', () => {
  const script = extractInlineModule(fallbackUtf8)
  // the inlined HMR runtime really does contain non-ASCII characters
  // (e.g. `…` in the console stringify helpers); if it ever becomes pure
  // ASCII again, the charset declaration above can be dropped together with
  // this test
  expect([...script].some((c) => c.codePointAt(0)! > 0x7f)).toBe(true)

  // Decoding the page as GBK — what zh-locale browsers do with a page that
  // declares no encoding — makes multi-byte sequences swallow ASCII bytes
  // such as backticks, leaving unterminated template literals. Before the
  // charset was declared, this SyntaxError killed the inline script, so the
  // page never reloaded once the bundle finished.
  const asGbk = new TextDecoder('gbk').decode(fallbackBytes)
  const gbkScript = extractInlineModule(asGbk)
  expect(jsSyntaxError(gbkScript)).not.toBeNull()
})
