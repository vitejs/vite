import { expect, test } from 'vitest'
import { editFile, isBuild, page } from '~utils'

// Faithful FBM port of Vite's plain `.wasm` default-import case (WASM ESM Integration)
// from playground/wasm.
// vite ref: playground/wasm/__tests__/wasm.spec.ts
//   `test('direct wasm import')` (L35-37): `import { add } from './add.wasm'`,
//      asserts `.direct-wasm .result` matches `3` (add(1, 2)).
//   `test('direct wasm import with wasm imports')` (L39-43):
//      `import { exported_func } from './light-with-imports.wasm'` +
//      `import { getResult } from './imports.js'`; `exported_func()` calls the wasm
//      import `imported_func(42)`, then `getResult()` returns 42.
//   + playground/wasm/index.html L45-46, L54-57.
//
// A plain `.wasm` import makes Vite's `vite:wasm-helper` plugin (plugins/wasm.ts:116-128)
// generate JS GLUE CODE that: imports the wasm helper (`\0vite/wasm-helper.js`),
// computes the wasm URL via `fileToUrl` (plugins/wasm.ts:103), top-level-awaits
// `initWasm(importObject, wasmUrl)` (which fetches/decodes + `WebAssembly.instantiate`s
// the bytes), and re-exports the wasm module's exports.
//
// So LOAD itself depends on the wasm URL being a REAL resolvable value: if it were an
// unresolved `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder or a 404, the helper's
// fetch -> instantiate would throw and the module would fail to load. THIS is the
// critical check for `.wasm` under FBM.
//
// Two URL shapes are exercised faithfully:
//   - small wasm (add.wasm 89B, light-with-imports.wasm 83B, both < assetsInlineLimit
//     4096B) -> inlined `data:application/wasm;base64,...` URI baked into the JS module;
//   - `add-padded.wasm` (5096B >= 4096B; add.wasm + a trailing wasm custom section so it
//     stays instantiable and add(1,2) is still 3) -> EMITTED `/assets/add-padded-<hash>.wasm`
//     real asset (the FBM-milestone-target path, where the emitted-asset freeze occurs).

// ---------------------------------------------------------------------------
// LOAD — wasm resolves + instantiates; the export returns the expected value, and
// NO unresolved placeholder/404 occurred. Same values Vite asserts (3 and 42), NOT
// weakened — plus the stronger "real URL, not a placeholder, fetches 200" checks.
// ---------------------------------------------------------------------------
test('plain .wasm loads + instantiates under FBM (bundledDev)', async () => {
  await expect.poll(() => page.textContent('.app')).toBe('wasm loaded')

  // No instantiation error surfaced (an unresolved placeholder/404 would land here).
  expect(await page.textContent('.error')).toBe('')

  // add.wasm (inlined data: URI) — same as Vite's `direct wasm import`.
  expect(await page.textContent('.direct-wasm .result')).toBe('3')

  // light-with-imports.wasm (inlined) — same as Vite's `direct wasm import with wasm
  // imports`: exported_func() -> imported_func(42) -> getResult() === 42.
  expect(await page.textContent('.direct-wasm-with-imports .result')).toBe('42')

  // add-padded.wasm (EMITTED asset) — instantiates from the real emitted URL.
  expect(await page.textContent('.direct-wasm-emitted .result')).toBe('3')

  // Prove the emitted wasm URL is a REAL resolvable `/assets/...-<hash>.wasm` (NOT a
  // `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder, NOT a 404) and that fetching it
  // returns valid wasm bytes (magic `\0asm`). This is the load-bearing resolution proof.
  const probe = await page.evaluate(async () => {
    // Walk the served entry + its JS deps to find the wasm glue's baked URL value
    // (`__vite__wasmUrl = "<url>"`) for the emitted wasm. We scope the placeholder
    // check to THIS value (the actual wasm URL the helper fetches), not arbitrary
    // chunk text — Vite's own runtime code legitimately contains the literal string
    // "__ROLLDOWN_ASSET__/__VITE_ASSET__" as data, which is not a wasm placeholder.
    const seen = new Set<string>()
    const queue = ['/assets/index.js']
    let wasmUrlValue: string | undefined
    let url: string | undefined
    while (queue.length) {
      const p = queue.shift()!
      if (seen.has(p)) continue
      seen.add(p)
      const txt = await (await fetch(p)).text()
      // The baked URL value for the padded (emitted) wasm.
      const v = txt.match(/__vite__wasmUrl\s*=\s*"([^"]*)"/g)
      if (v) {
        for (const one of v) {
          const val = one.match(/"([^"]*)"/)?.[1] ?? ''
          if (val.includes('add-padded')) wasmUrlValue = val
        }
      }
      const m = txt.match(/\/assets\/add-padded-[^"'\s]*\.wasm/)
      if (m) url = m[0]
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
    return { wasmUrlValue, url, status, magicOk }
  })
  // The baked wasm URL the helper fetches is a REAL emitted asset, NOT a placeholder.
  expect(probe.wasmUrlValue).toMatch(/\/assets\/add-padded-[-\w]+\.wasm/)
  expect(probe.wasmUrlValue).not.toMatch(/__ROLLDOWN_ASSET__|__VITE_ASSET__/)
  expect(probe.url).toMatch(/\/assets\/add-padded-[-\w]+\.wasm/)
  // Fetching it succeeds (200) and returns valid wasm bytes (magic `\0asm`).
  expect(probe.status).toBe(200)
  expect(probe.magicOk).toBe(true)
})

// ---------------------------------------------------------------------------
// HMR — KNOWN FAILURE in FBM (marked `test.fails` so the committed suite stays green).
// Vite would re-serve the changed wasm; under FBM the EMITTED `/assets/...-<hash>.wasm`
// is FROZEN. Editing the `.wasm` source fires NO HMR event at all (the source is never
// watched — neither plugins/wasm.ts nor `fileToBuiltUrl` calls `this.addWatchFile`,
// the same gap as `?inline`) AND the emitted asset would not be re-emitted on an
// incremental HMR patch anyway (#22596 family — `renderChunk` skipped, `handleHmrOutput`
// relays only JS patches). So both the URL hash and the served bytes stay stale.
// See RESULT.md §5 `.wasm` for the full root cause.
if (!isBuild) {
  test.fails('editing the .wasm re-serves fresh bytes under FBM (FROZEN — known fail)', async () => {
    const findUrl = () =>
      page.evaluate(async () => {
        const seen = new Set<string>()
        const queue = ['/assets/index.js']
        while (queue.length) {
          const p = queue.shift()!
          if (seen.has(p)) continue
          seen.add(p)
          const txt = await (await fetch(p)).text()
          const m = txt.match(/\/assets\/add-padded-[^"'\s]*\.wasm/)
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

    // Binary-safe edit: flip the final padding byte (0 -> 1). The wasm stays valid and
    // add(1,2) is still 3; only the served bytes + content hash should change.
    editFile('add-padded.wasm', null, (buf: Buffer) => {
      const mod = Buffer.from(buf)
      mod[mod.length - 1] = 1
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
