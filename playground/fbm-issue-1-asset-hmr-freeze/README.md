# FBM Issue 1 — Emitted/inlined static assets freeze on HMR

> Part of the Full Bundle Mode (FBM = `experimental.bundledDev`) non-JS-module HMR audit.
> This directory is a standalone, runnable Vite playground app; the only non-default setting
> is `experimental.bundledDev: true` (see `vite.config.ts`). Index: [`../FBM-ISSUES.md`](../FBM-ISSUES.md).

- **GitHub:** [vitejs/vite#22596](https://github.com/vitejs/vite/issues/22596)
- **Severity:** 🔴 High
- **Affected module types:** **35** (this repro uses `.png`)

## Summary

Under FBM, a static-asset import resolves to a real hashed `/assets/<name>-<hash>.<ext>` URL
(or, for files < 4096 B, an inline `data:` URI) and loads correctly. But after you edit the
asset file, the **served bytes and the URL hash stay frozen** at the pre-edit value — no HMR
patch is emitted and no full reload happens. The asset is effectively immutable until the dev
server restarts.

## Affected module types (35)

- **CSS / query form of the same freeze:** CSS `?url` (`css-url`), `?url` of any file (`query-url`)
- **Images (14):** apng, avif, bmp, cur, gif, ico, jfif, jpg, jxl, pjp, pjpeg, png, svg, webp
- **Media (11):** aac, flac, m4a, mov, mp3, mp4, ogg, opus, vtt, wav, webm
- **Fonts (5):** eot, otf, ttf, woff, woff2
- **Other (3):** pdf, txt, webmanifest

Each was verified individually (`playground/fbm-check-<type>/`). The 4096 B boundary
(`DEFAULT_ASSETS_INLINE_LIMIT`) only decides _emitted asset_ vs _inline `data:` URI_ — **both freeze**.

## Expected behavior

Editing an imported asset updates what the app sees, exactly as in normal (non-FBM) Vite dev:
the asset is served live from its dev URL and a change triggers a full reload showing the new
bytes; `fetch()` of the URL returns the edited content.

## Current behavior (FBM)

- **Initial load works:** `import url from './sample.png'` → `/assets/sample-<hash>.png`
  (e.g. `/assets/sample-DAS36_oa.png`); `fetch(url)` → `200` with the real bytes (contains
  `PNG-FBM-MARKER-V1`). Not an unresolved placeholder, not a 404.
- **After editing `sample.png` (`PNG-FBM-MARKER-V1` → `PNG-FBM-MARKER-V2`):** the imported URL
  hash is **unchanged**, a fresh `fetch(url, {cache:'no-store'})` still returns the **pre-edit**
  bytes (`…-V1`, never `…-V2`), and **no HMR event fires at all** (no `handle hmr output`, no
  `js-update`, no `trigger page reload`). The asset is frozen.

> `sample.png` deliberately holds known _text_ bytes — Vite's asset pipeline is extension-keyed
> (content is not validated), so this exercises the identical pipeline as a real image while
> letting you read the served bytes. It is 10658 B (> 4096 B) to exercise the emitted-asset path.

## Steps to reproduce

**Manual (watch it freeze in a browser):**

1. `cd playground/fbm-issue-1-asset-hmr-freeze && pnpm dev`, then open http://localhost:5173/.
2. The page prints the imported URL (`/assets/sample-<hash>.png`) and the fetched bytes
   (containing `PNG-FBM-MARKER-V1`).
3. Edit `sample.png` and change `PNG-FBM-MARKER-V1` → `PNG-FBM-MARKER-V2`.
4. **Observe:** the page does not change — the URL hash is the same and the fetched bytes still
   say `V1`; no reload fires. Restarting `pnpm dev` _does_ pick up the change (proving the edit
   is valid and the freeze is the bug).

**Automated (from the Vite repo root):**

```sh
pnpm test-serve fbm-issue-1-asset-hmr-freeze
```

Result: `Tests 1 passed | 1 expected fail (2)`. The load test passes; the HMR test is marked
`test.fails`, so it "passes as expected-fail" _because the freeze is present_. When the bug is
fixed, that test will start failing → flip `test.fails` back to `test`.

## Root cause

Under FBM the client environment is `isBundled: true`
(`packages/vite/src/node/config.ts:952-953`), so `fileToUrl` takes the **build** branch
`fileToBuiltUrl` (`plugins/asset.ts:326-330`) instead of the dev branch `fileToDevUrl`. The
emitted asset is written into the dev server's `memoryFiles` only by the **full-build**
`onOutput` callback (`server/bundledDev.ts:161-194`). The incremental HMR relay
`handleHmrOutput` (`server/bundledDev.ts:375-451`) carries **JS patches only** — it deliberately
skips `renderChunk` (`:354`) and never re-emits assets — so an asset-byte edit re-emits nothing.

## Fix direction

One structural fix covers the whole family: **stop forcing the build asset path in FBM dev** so
`fileToUrl` uses `fileToDevUrl` (a live, re-transforming server URL, as in normal dev).
Alternatively, re-emit the changed asset into `memoryFiles` as part of incremental HMR output,
or fall back to a full reload for asset-graph changes.

## Related

Same `#22596` family as [Issue 2](../fbm-issue-2-asset-no-watch/README.md) (`?inline`/wasm — no
`addWatchFile`) and [Issue 5](../fbm-issue-5-glob-no-dir-watch/README.md) (`import.meta.glob`
`?url`). Positive controls that _do_ work — `new URL('./x.png', import.meta.url)` and `?worker` —
work precisely because they own an `addWatchFile` → invalidate → re-emit pipeline.
