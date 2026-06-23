import { expect, test } from 'vitest'
import { editFile, isBuild, page, untilBrowserLogAfter } from '~utils'

// Faithful FBM port of Vite's HTML-edit full-reload case.
//
// vite ref: playground/hmr/__tests__/hmr.spec.ts
//   - `test('HTML')`                  L789-801 (edit counter/index.html `Counter`->`Compteur`,
//                                               `page.waitForEvent('load')`, assert new text)
//   - `test('full-reload encodeURI path')` L307-320 (edit index.html text, wait `load`, assert)
// + playground/hmr/counter/index.html + counter/index.ts (a `<button>Counter 0</button>`
//   in the markup + a module entry script).
//
// HTML is the dev-server ENTRY, not an importable module. Vite's non-FBM dev FULL-RELOADS
// when index.html is edited so the new markup shows (server/hmr.ts:624-638). The needle
// "Counter" occurs EXACTLY ONCE in index.html's real markup (the button) — clean single-
// match edit, no comment collision.
//
// FBM is dev-only, so the HMR assertion only runs in serve mode.

// 1. LOAD: the served index.html renders, its linked entry script runs, and the markup
//    that lives only in the HTML (the button text) is present.
test('index.html renders + entry runs under FBM (bundledDev)', async () => {
  // markup from the HTML file itself
  await expect.poll(() => page.textContent('button.counter')).toBe('Counter 0')
  // the linked entry module ran
  await expect.poll(() => page.textContent('.app')).toBe('html entry loaded')
})

if (!isBuild) {
  // 2. HMR: editing the served index.html's markup. Vite (non-FBM) does a FULL PAGE
  //    RELOAD that reflects the new markup (hmr.spec.ts `test('HTML')`). Under FBM the
  //    markup edit is FROZEN — the new text is NEVER served:
  //      * `vite:build-html` compiles index.html into a JS *entry* under FBM
  //        (html.ts:411,433-434 `applyToEnvironment -> isBundled`), so the served HTML
  //        comes from the bundle's `memoryFiles`, NOT a fresh `transformIndexHtml`
  //        (indexHtml.ts:467-499).
  //      * The Rolldown dev engine reports the index.html change as a `Noop`, so FBM
  //        logs "ignored file change for .../index.html" and returns WITHOUT re-emitting
  //        the HTML (bundledDev.ts:149-151). (The regular `.html` -> full-reload path in
  //        hmr.ts:624-638 is also skipped: handleHMRUpdate early-returns for bundledDev
  //        at hmr.ts:463-466.)
  //      * A full reload still fires later via the generic "stale bundle" path
  //        (`triggerBundleRegenerationIfStale` -> bundledDev.ts:300-308), so the page
  //        DOES reload — but the regenerated bundle still carries the OLD markup, so the
  //        reload shows stale `Counter 0` forever (verified: served HTML never contains
  //        `Compteur 0`).
  //
  //    Marked `test.fails(...)`: it asserts Vite's expected fresh-markup-after-reload
  //    behavior, which does NOT hold under FBM, so the test "fails" (documenting the gap)
  //    while the committed suite stays green. The failing assertion is the final
  //    markup poll (the reload fires, but the markup stays stale). Flip back to
  //    `test(...)` once FBM re-emits the edited HTML on an index.html change.
  test.fails('editing index.html shows the new markup under FBM (frozen: reload serves stale HTML)', async () => {
    expect(await page.textContent('button.counter')).toBe('Counter 0')

    // Edit the markup needle. main.js logs on `vite:beforeFullReload`; a full reload
    // DOES fire here (the stale-bundle path), so this log is seen — but the reloaded
    // page serves the OLD markup because the HTML edit was ignored as a Noop.
    await untilBrowserLogAfter(
      () =>
        editFile('index.html', (code) =>
          code.replace('Counter 0', 'Compteur 0'),
        ),
      'html full reload',
    )

    // The reload fired, but FBM never re-emits the edited HTML, so the new markup is
    // never served. This is the assertion that FAILS under FBM (markup stays
    // 'Counter 0'); it would pass in Vite's non-FBM dev.
    await expect
      .poll(() => page.textContent('button.counter'))
      .toBe('Compteur 0')
  })
}
