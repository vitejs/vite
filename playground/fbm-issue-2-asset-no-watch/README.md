# FBM Issue 2 — `?inline`/`?url` asset (and `.wasm`) imports never re-evaluate on edit (source not watched)

> Part of the Full Bundle Mode (FBM = `experimental.bundledDev`) non-JS-module HMR audit.
> Standalone runnable Vite playground app; only non-default setting is
> `experimental.bundledDev: true`. Index: [`../FBM-ISSUES.md`](../FBM-ISSUES.md).

- **GitHub:** [vitejs/vite#22596](https://github.com/vitejs/vite/issues/22596) (compound)
- **Severity:** 🟠 Medium
- **Affected module types:** **4** — `query-inline` (`?inline`), `query-url-inline` (`?url&inline`),
  `wasm`, `wasm-init` (this repro uses a `?inline` SVG + a `?no-inline` SVG)

## Summary

The `vite:asset` `load` branch that handles `?inline` / `?url` / asset imports **never calls
`this.addWatchFile(file)`** — only the `?raw` branch does. So under FBM, editing the source of an
**inlined `data:` URI import fires no HMR event at all**: the baked `data:` URI never refreshes
(distinct from Issue 1, where an emitted asset at least _could_ be re-emitted). The `vite:wasm-helper`
`load` has the same gap, so `.wasm` / `.wasm?init` freeze the same way. The emitted (`?no-inline`)
sibling additionally freezes via the Issue 1 asset-re-emit gap.

## Why this is distinct from Issue 1 — the three-way split

| Form                                      | Value lives in            |              Watched?               | HMR result                                    |
| ----------------------------------------- | ------------------------- | :---------------------------------: | --------------------------------------------- |
| `?raw`                                    | JS module (string)        | ✅ `addWatchFile` at `asset.ts:206` | **fresh**                                     |
| `?inline` / `.wasm` (small)               | JS module (`data:` URI)   |        ❌ no `addWatchFile`         | **frozen — no event fires**                   |
| `?no-inline` / `?url` / `.wasm` (≥4096 B) | emitted `/assets/…` asset |                 ❌                  | **frozen — asset never re-emitted (Issue 1)** |

`?inline` "should" behave like `?raw` (both bake the value into the JS module), but it freezes
purely because its `load` branch never watches the source.

## Expected behavior

Editing the source re-evaluates the importing module so the recomputed `data:` URI (or re-emitted
asset) reflects the edit — as in normal Vite dev.

## Current behavior (FBM)

- **`?inline` (133 B `inline.svg`):** loads as `data:image/svg+xml,…INLINEMARKERALPHA…`. After
  editing `inline.svg` (`INLINEMARKERALPHA` → `INLINEMARKEROMEGA`): the `data:` URI is **unchanged**;
  under `DEBUG=vite:full-bundle-mode` **no event of any kind fires** (no watcher change, no
  `handle hmr output`, no reload).
- **`?no-inline` (134 B `noinline.svg`):** loads as `/assets/noinline-<hash>.svg` (e.g.
  `/assets/noinline-BXT79dsq.svg`), `fetch` → `200` with `NOINLINEMARKERALPHA`. After editing
  (`…ALPHA` → `…OMEGA`): URL hash unchanged, fetched bytes still `…ALPHA` (the Issue 1 freeze).

> `?inline`/`?no-inline` use tiny SVGs so the **suffix**, not file size, decides inline-vs-emit.
> `.wasm` / `.wasm?init` (see `playground/fbm-check-wasm`) behave identically: small → frozen
> `data:application/wasm` URI, ≥4096 B → frozen emitted `/assets/<name>-<hash>.wasm`.

## Steps to reproduce

**Manual:**

1. `cd playground/fbm-issue-2-asset-no-watch && pnpm dev`, open http://localhost:5173/.
2. The page prints the `?inline` value (a `data:image/svg+xml,…ALPHA…` URI) and the `?no-inline`
   value (`/assets/noinline-<hash>.svg`) + its fetched body.
3. Edit `inline.svg`: `INLINEMARKERALPHA` → `INLINEMARKEROMEGA`. **Observe:** the printed `?inline`
   value never changes; no reload.
4. Edit `noinline.svg`: `NOINLINEMARKERALPHA` → `NOINLINEMARKEROMEGA`. **Observe:** the emitted
   asset URL/body stays frozen.

**Automated (from the Vite repo root):**

```sh
pnpm test-serve fbm-issue-2-asset-no-watch
```

Result: `Tests 2 passed | 2 expected fail (4)` (both loads pass; both HMR halves are `test.fails`).

## Root cause

- **Gap 1 — source never watched:** `plugins/asset.ts:204-206` (the `?raw`/`rawRE` branch _does_
  `this.addWatchFile(file)`) **vs** `plugins/asset.ts:217-243` (the asset/url/inline branch — no
  `addWatchFile`). The inlined `data:` URI is memoized in `assetCache` (`:445-449`, `:487`), evicted
  only by `watchChange` (`:314-316`), which fires only for watched files. `plugins/wasm.ts:89-128`
  (`vite:wasm-helper` `load`) likewise never `addWatchFile`s.
- **Gap 2 — emitted sibling never re-emitted:** `config.ts:952-953` (FBM `isBundled:true`) +
  `bundledDev.ts:375-451` (`handleHmrOutput` relays JS only) — the Issue 1 mechanism.

## Fix direction

Add `this.addWatchFile(file)` (and `assetCache` eviction) to the `vite:asset` url/inline `load`
branch and the wasm helper, mirroring the `?raw` branch — so the JS-resident `data:` URI re-evaluates
on edit. Apply the Issue 1 asset-re-emit fix for the emitted sibling.

## Related

[Issue 1](../fbm-issue-1-asset-hmr-freeze/README.md) (emitted-asset freeze),
[Issue 5](../fbm-issue-5-glob-no-dir-watch/README.md) (`import.meta.glob` `?url`).
Positive controls `url-import-meta-url` and `worker` **pass** precisely because they call
`addWatchFile`.
