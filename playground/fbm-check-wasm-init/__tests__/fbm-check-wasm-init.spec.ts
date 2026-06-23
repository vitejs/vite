import { expect, test } from 'vitest'
import { editFile, isBuild, page } from '~utils'

// Faithful FBM port of Vite's `*.wasm?init` case from playground/wasm.
// vite ref: playground/wasm/__tests__/wasm.spec.ts
//   `test('should work when inlined')` (L4-9): clicks `.inline-wasm .run`, which runs
//      `testWasm(light, ...)` with `import light from './light.wasm?init'`; asserts
//      `.inline-wasm .result` matches `42`.
//   `test('should work when output')` (L11-16): `import heavy from './heavy.wasm?init'`;
//      asserts `.output-wasm .result` matches `24` (heavy is >=4096B so it EMITS an asset).
//   `test('init function returns WebAssembly.Instance')` (L18-23): `await light({...})`;
//      asserts `.init-returns-instance .result` matches `true`.
//   + playground/wasm/index.html L42-43, L59-96.
//
// `*.wasm?init` makes Vite's `vite:wasm-helper` plugin (plugins/wasm.ts:109-114) emit a
// tiny module whose DEFAULT EXPORT is an init function:
//   import initWasm from "\0vite/wasm-helper.js"
//   export default opts => initWasm(opts, "<url>")
// `<url>` is computed by `fileToUrl` (wasm.ts:103) — under FBM (`isBundled: true`) this is
// the BUILD asset path (`fileToBuiltUrl`, asset.ts:326-330): an inline `data:application/wasm`
// URI for small files, a real `/assets/<name>-<hash>.wasm` for files >= assetsInlineLimit.
// Calling `await init(opts)` fetches/decodes that URL and returns a `WebAssembly.Instance`
// (wasm.ts:17-40). So the CALL depends on `<url>` being a REAL resolvable value: an
// unresolved `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder or a 404 would throw.
//
// Two URL shapes are exercised faithfully (Vite's own fixtures, byte-identical):
//   - light.wasm (78B < 4096) -> inlined `data:application/wasm;base64,...` URI;
//   - heavy.wasm (4274B >= 4096) -> EMITTED `/assets/heavy-<hash>.wasm` real asset
//     (the FBM-milestone-target path, where the emitted-asset freeze occurs).

// ---------------------------------------------------------------------------
// LOAD — init() resolves the wasm URL + instantiates; exported_func returns the expected
// value, init() yields a WebAssembly.Instance, and NO unresolved placeholder/404 occurred.
// Same values Vite asserts (42, 24, true), NOT weakened — plus the stronger "real URL, not
// a placeholder, fetches 200 + wasm magic" checks for the emitted heavy.wasm?init asset.
// ---------------------------------------------------------------------------
test('*.wasm?init loads + init() instantiates under FBM (bundledDev)', async () => {
  await expect.poll(() => page.textContent('.app')).toBe('wasm-init loaded')

  // No init()/instantiation error surfaced (an unresolved placeholder/404 would land here).
  expect(await page.textContent('.error')).toBe('')

  // light.wasm?init (inlined data: URI) — same as Vite's `should work when inlined` (42):
  // init() -> instance.exports.exported_func() -> imported_func(42).
  expect(await page.textContent('.inline-wasm-init .result')).toBe('42')

  // heavy.wasm?init (EMITTED asset) — same as Vite's `should work when output` (24):
  // init() instantiates from the real emitted URL -> exported_func() -> imported_func(24).
  expect(await page.textContent('.output-wasm-init .result')).toBe('24')

  // init() resolves to a WebAssembly.Instance — same as Vite's
  // `init function returns WebAssembly.Instance` (true).
  expect(await page.textContent('.init-returns-instance .result')).toBe('true')

  // Prove the emitted heavy.wasm?init URL is a REAL resolvable `/assets/heavy-<hash>.wasm`
  // (NOT a `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder, NOT a 404) and that fetching
  // it returns valid wasm bytes (magic `\0asm`). This is the load-bearing resolution proof.
  // Unlike the direct `.wasm` import (which bakes `__vite__wasmUrl = "<url>"`), the `?init`
  // glue inlines the URL as the 2nd arg of `initWasm(opts, "<url>")`, so we scan the served
  // JS deps for the emitted `/assets/heavy-<hash>.wasm` literal directly.
  const probe = await page.evaluate(async () => {
    const seen = new Set<string>()
    const queue = ['/assets/index.js']
    let url: string | undefined
    let placeholderInWasmGlue = false
    while (queue.length) {
      const p = queue.shift()!
      if (seen.has(p)) continue
      seen.add(p)
      const txt = await (await fetch(p)).text()
      const m = txt.match(/\/assets\/heavy-[^"'\s]*\.wasm/)
      if (m) {
        url = m[0]
        // If this same chunk holds the wasm init glue, make sure the wasm URL arg is not
        // an unresolved placeholder (scoped to the initWasm(...) call, not arbitrary text).
        if (/initWasm\([^)]*__(?:ROLLDOWN|VITE)_ASSET__/.test(txt)) {
          placeholderInWasmGlue = true
        }
      }
      for (const mm of txt.matchAll(/["']([^"']+\.js)["']/g)) {
        let dep = mm[1]
        if (dep.startsWith('./')) dep = '/assets/' + dep.slice(2)
        if (dep.startsWith('/assets/')) queue.push(dep)
      }
    }
    let status = 0
    let magicOk = false
    if (url) {
      const res = await fetch(url)
      status = res.status
      const buf = new Uint8Array(await res.arrayBuffer())
      magicOk =
        buf[0] === 0x00 && buf[1] === 0x61 && buf[2] === 0x73 && buf[3] === 0x6d // \0asm
    }
    return { url, status, magicOk, placeholderInWasmGlue }
  })
  // The emitted heavy.wasm?init URL is a REAL emitted asset, NOT a placeholder.
  expect(probe.url).toMatch(/\/assets\/heavy-[-\w]+\.wasm/)
  expect(probe.placeholderInWasmGlue).toBe(false)
  // Fetching it succeeds (200) and returns valid wasm bytes (magic `\0asm`).
  expect(probe.status).toBe(200)
  expect(probe.magicOk).toBe(true)
})

// ---------------------------------------------------------------------------
// HMR — KNOWN FAILURE in FBM (marked `test.fails` so the committed suite stays green).
// Vite would re-serve the changed wasm; under FBM the EMITTED `/assets/heavy-<hash>.wasm`
// is FROZEN. Same two-gap root cause as the direct `.wasm` import (RESULT.md §5 `.wasm`):
//   (1) the `.wasm` source is NEVER WATCHED — neither plugins/wasm.ts nor `fileToBuiltUrl`
//       calls `this.addWatchFile`, so editing it fires NO HMR event at all (same gap as
//       `?inline`); and
//   (2) the emitted asset is never re-emitted on an incremental HMR patch (#22596 family —
//       `renderChunk` skipped, `handleHmrOutput` relays only JS patches).
// `?init` reaches the identical `fileToUrl` -> `fileToBuiltUrl` emit path (wasm.ts:103),
// so it inherits both gaps verbatim. So both the URL hash and the served bytes stay stale.
if (!isBuild) {
  test.fails('editing the .wasm?init source re-serves fresh bytes under FBM (FROZEN — known fail)', async () => {
    const findUrl = () =>
      page.evaluate(async () => {
        const seen = new Set<string>()
        const queue = ['/assets/index.js']
        while (queue.length) {
          const p = queue.shift()!
          if (seen.has(p)) continue
          seen.add(p)
          const txt = await (await fetch(p)).text()
          const m = txt.match(/\/assets\/heavy-[^"'\s]*\.wasm/)
          if (m) return m[0]
          for (const mm of txt.matchAll(/["']([^"']+\.js)["']/g)) {
            let dep = mm[1]
            if (dep.startsWith('./')) dep = '/assets/' + dep.slice(2)
            if (dep.startsWith('/assets/')) queue.push(dep)
          }
        }
        return undefined
      })

    const url1 = await findUrl()
    const lastByte = (u: string) =>
      page.evaluate(async (uu) => {
        const buf = new Uint8Array(
          await (await fetch(uu + '?t=' + Date.now())).arrayBuffer(),
        )
        return buf[buf.length - 1]
      }, u)
    const before = await lastByte(url1!)

    // Binary-safe edit: flip the final byte of heavy.wasm (a trailing sourcemap-name
    // custom-section byte; wasm ignores unknown content there). The wasm stays valid and
    // exported_func() still calls imported_func(24); only the served bytes + content hash
    // should change.
    editFile('heavy.wasm', null, (buf: Buffer) => {
      const mod = Buffer.from(buf)
      mod[mod.length - 1] = mod[mod.length - 1] ^ 0x01
      return mod
    })

    // The served emitted asset must reflect the edit (fresh bytes). Under FBM it does
    // NOT — this poll never observes the new byte, so the assertion fails (expected).
    await expect
      .poll(
        async () => {
          const u = await findUrl()
          return lastByte(u!)
        },
        { timeout: 3000 },
      )
      .not.toBe(before)
  })
}
