import { expect, test } from 'vitest'
import { addFile, editFile, isBuild, page, removeFile } from '~utils'

// Faithful FBM port of Vite's `import.meta.glob(...)` case in playground/glob-import.
// vite ref: playground/glob-import/__tests__/glob-import.spec.ts
//   - `test('should work')` (L90-102): the lazy + eager glob maps (`allResult`).
//   - `test('import glob raw')` (L104-108): `{ query: '?raw', eager: true, import: 'default' }`
//     yields raw file strings (`rawResult`).
//   - `test('hmr for adding/removing files')` (L135-186): addFile/editFile/removeFile and the
//     glob map UPDATES (new module appears / its edit is reflected / it disappears) WITHOUT a
//     manual restart — this is the M2 "Proper import.meta.glob support" directory-watching test.
//   + playground/glob-import/root/index.html (L54-118: the plain/eager/`?raw` glob calls).
//
// The ONLY intended change vs. the non-FBM playground is enabling FBM (experimental.bundledDev).
//
// Under FBM the JS-side `vite:import-glob` plugin is SWAPPED OUT for Rolldown's native
// `builtin:vite-import-glob` (importMetaGlob.ts:45-53 — `applyToEnvironment` returns
// `nativeImportGlobPlugin(...)` when `environment.config.isBundled`). That native plugin
// (crates/rolldown_plugin_vite_import_glob/src/lib.rs) only registers a `transform` hook
// (HookUsage::Transform, lib.rs:22-24); it expands the glob to static import declarations via
// a one-shot `walkdir::WalkDir` (utils.rs:480) and NEVER `add_watch_file`s the directory, and
// has no `hotUpdate`/`watchChange`. So:
//   - Initial load works (eager + lazy js maps, `?raw` strings, `?url` URLs).               [PASS]
//   - Editing a globbed file's CONTENT updates fresh — the matched files are real import-graph
//     deps that HMR re-evaluates: `.js` fresh, `?raw` fresh.                                  [PASS]
//   - Editing a globbed `?url` file's content FREEZES — the emitted `/assets/<hash>.<ext>`
//     asset is the §4 `?url` / §3 image frozen-emitted-asset path (#22596 family).            [FAIL]
//   - ADDING / REMOVING a matching file does NOT update the glob set — the Vite JS-plugin
//     `hotUpdate` hook (importMetaGlob.ts:111-125) that re-globs on add/remove never runs under
//     FBM, and Rolldown's native plugin doesn't watch the dir. This is the documented M2 gap.  [FAIL]
// See RESULT.md §7 `import.meta.glob`.
//
// FBM is dev-only, so the assertions only run in serve mode.
if (!isBuild) {
  // ── 1. INITIAL LOAD ───────────────────────────────────────────────────────────────────
  // The glob resolves the matching files and loads their values correctly (eager + lazy js
  // maps; `?raw` raw strings; `?url` resolves to a real emitted asset URL whose bytes fetch).
  test('initial glob load resolves js / ?raw / ?url under FBM (bundledDev)', async () => {
    await expect.poll(() => page.textContent('.app')).toBe('glob loaded')

    // Lazy glob — value is `() => import(path)`, resolved to { key: msg }.
    expect(JSON.parse(await page.textContent('.result'))).toStrictEqual({
      './dir/bar.js': 'bar',
      './dir/foo.js': 'foo',
    })
    // Eager glob — modules directly.
    expect(JSON.parse(await page.textContent('.result-eager'))).toStrictEqual({
      './dir/bar.js': 'bar',
      './dir/foo.js': 'foo',
    })
    // `?raw` — raw file strings (un-transformed file contents).
    expect(JSON.parse(await page.textContent('.result-raw'))).toStrictEqual({
      './dir/a.txt': 'FBM-GLOB-RAW-A-V1',
      './dir/b.txt': 'FBM-GLOB-RAW-B-V1',
    })
    // `?url` — values are real emitted asset URLs (>4096 B so not inlined as data: URIs),
    // NOT unresolved placeholders, and fetch(url) returns the known bytes.
    const urlMap = JSON.parse(await page.textContent('.result-url'))
    for (const k of ['./dir/a.txt', './dir/b.txt']) {
      expect(urlMap[k]).toMatch(/\/assets\/[-\w]+\.txt/)
      expect(urlMap[k]).not.toMatch(/__ROLLDOWN_ASSET__|__VITE_ASSET__/)
    }
    const fetched = JSON.parse(await page.textContent('.result-url-fetched'))
    expect(fetched['./dir/a.txt']).toContain('FBM-GLOB-RAW-A-V1')
    expect(fetched['./dir/b.txt']).toContain('FBM-GLOB-RAW-B-V1')
  })

  // ── 2. CONTENT-EDIT HMR — globbed .js (FRESH) ─────────────────────────────────────────
  // Editing the CONTENT of an already-globbed .js file updates fresh in both the eager and
  // lazy maps (the matched files are real import-graph deps that HMR re-evaluates).
  test('editing a globbed .js file updates the glob value (fresh, not frozen) under FBM', async () => {
    editFile('dir/foo.js', (c) => c.replace("'foo'", "'foo-edited'"))
    try {
      await expect
        .poll(() => page.evaluate(() => window.__GLOB__.eagerKeys()))
        .toStrictEqual(['./dir/bar.js', './dir/foo.js'])
      await expect
        .poll(async () => JSON.parse(await page.textContent('.result-eager')))
        .toStrictEqual({ './dir/bar.js': 'bar', './dir/foo.js': 'foo-edited' })
    } finally {
      editFile('dir/foo.js', (c) => c.replace("'foo-edited'", "'foo'"))
      await expect
        .poll(async () => JSON.parse(await page.textContent('.result-eager')))
        .toStrictEqual({ './dir/bar.js': 'bar', './dir/foo.js': 'foo' })
    }
  })

  // ── 3. CONTENT-EDIT HMR — globbed ?raw (FRESH) ────────────────────────────────────────
  // Editing the CONTENT of an already-globbed `?raw` file updates fresh — the `?raw` module
  // is a real import-graph dep that re-evaluates with the new file contents.
  test('editing a globbed ?raw file updates the raw string (fresh, not frozen) under FBM', async () => {
    editFile('dir/a.txt', (c) =>
      c.replace('FBM-GLOB-RAW-A-V1', 'FBM-GLOB-RAW-A-V2'),
    )
    try {
      await expect
        .poll(() => page.evaluate(() => window.__GLOB__.rawValues()))
        .toMatchObject({ './dir/a.txt': 'FBM-GLOB-RAW-A-V2' })
    } finally {
      editFile('dir/a.txt', (c) =>
        c.replace('FBM-GLOB-RAW-A-V2', 'FBM-GLOB-RAW-A-V1'),
      )
      await expect
        .poll(() => page.evaluate(() => window.__GLOB__.rawValues()))
        .toMatchObject({ './dir/a.txt': 'FBM-GLOB-RAW-A-V1' })
    }
  })

  // ── 4. CONTENT-EDIT HMR — globbed ?url (FROZEN — known FBM gap) ────────────────────────
  // Editing the CONTENT of an already-globbed `?url` file does NOT refresh the bytes served
  // at the emitted `/assets/<hash>.<ext>` URL — same frozen-emitted-asset root cause as the
  // §4 `?url` entry (#22596 family): the `vite:asset` url branch never `addWatchFile`s the
  // source, so the edit fires no HMR event → `onOutput` never re-emits the asset. Marked
  // test.fails: it PASSES (expectations hold) only while the freeze bug exists.
  test.fails('editing a globbed ?url file refreshes the served asset bytes under FBM (FROZEN — #22596 family, see RESULT.md §7)', async () => {
    const before = await page.evaluate(() => window.__GLOB__.fetchUrls())
    expect(before['./dir/a.txt']).toContain('FBM-GLOB-RAW-A-V1')

    editFile('dir/a.txt', (c) =>
      c.replace('FBM-GLOB-RAW-A-V1', 'FBM-GLOB-RAW-A-V3'),
    )
    try {
      // FRESH would serve V3; FROZEN keeps serving V1 → this poll times out → test.fails passes.
      await expect
        .poll(() => page.evaluate(() => window.__GLOB__.fetchUrls()), {
          timeout: 4000,
        })
        .toMatchObject({ './dir/a.txt': expect.stringContaining('V3') })
    } finally {
      editFile('dir/a.txt', (c) =>
        c.replace('FBM-GLOB-RAW-A-V3', 'FBM-GLOB-RAW-A-V1'),
      )
    }
  })

  // ── 5. ADD / REMOVE FILE — directory watching (FROZEN — the M2 concern) ────────────────
  // Adding (or removing) a file that matches the glob does NOT update the glob set without a
  // manual restart. Vite's own non-FBM test (glob-import.spec.ts L135-186) expects the new
  // module to APPEAR; under FBM it does not, because the Vite JS-plugin `hotUpdate` re-glob
  // (importMetaGlob.ts:111-125) is swapped out for Rolldown's native transform-only plugin,
  // which globs once via walkdir and never watches the directory. This is the documented
  // open M2 "Proper import.meta.glob support" gap. Marked test.fails: the assertions
  // (new file appears / removed file disappears) PASS only while directory watching works,
  // so the test stays green by failing while the gap exists.
  test.fails('adding a file that matches the glob makes it appear in the glob set under FBM (FROZEN — M2 directory-watching gap, see RESULT.md §7)', async () => {
    addFile('dir/c.js', "export const msg = 'c'")
    try {
      // Directory-watching would add './dir/c.js'; under FBM the set is frozen at the
      // initial walk → this poll times out → test.fails passes.
      await expect
        .poll(() => page.evaluate(() => window.__GLOB__.eagerKeys()), {
          timeout: 4000,
        })
        .toStrictEqual(['./dir/bar.js', './dir/c.js', './dir/foo.js'])
    } finally {
      removeFile('dir/c.js')
    }
  })
}
