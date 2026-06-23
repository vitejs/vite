# FBM Issue 5 — Native `import.meta.glob` has no directory-watch / re-glob

> Part of the Full Bundle Mode (FBM = `experimental.bundledDev`) non-JS-module HMR audit.
> Standalone runnable Vite playground app; only non-default setting is
> `experimental.bundledDev: true`. Index: [`../FBM-ISSUES.md`](../FBM-ISSUES.md).

- **GitHub:** [vitejs/vite#22596](https://github.com/vitejs/vite/issues/22596) (compound) — the
  M2 "Proper `import.meta.glob` support" directory-watching gap.
- **Severity:** 🟠 Medium
- **Affected module types:** **1** (`import-meta-glob`)

## Summary

Under FBM, Vite's JS `vite:import-glob` plugin (which re-globs on file add/remove via a `hotUpdate`
hook) is **replaced** by Rolldown's native `builtin:vite-import-glob` — a transform-only plugin that
expands the glob with a one-shot `walkdir` and **never watches the globbed directory**. So
**adding/removing files never updates the glob set**. Separately, editing a globbed `?url` file's
content freezes (inherited from Issues 1 & 2).

## The four sub-behaviors

| Sub-behavior                                      |                          Result                           |
| ------------------------------------------------- | :-------------------------------------------------------: |
| Initial load (lazy + eager `.js`, `?raw`, `?url`) |                         ✅ works                          |
| `.js` member **content** edit                     |           ✅ fresh (ordinary module-graph edge)           |
| `?raw` member **content** edit                    |                         ✅ fresh                          |
| `?url` member **content** edit                    | ❌ frozen (emitted asset never re-emitted — Issues 1 & 2) |
| **add / remove** a file matching the glob         |         ❌ glob set frozen (the headline M2 gap)          |

## Expected behavior

Adding or removing a file that matches the glob updates the glob set — the new module appears /
the removed module disappears — as in normal Vite dev (`import.meta.glob`'s `hotUpdate` re-glob).

## Current behavior (FBM)

- `addFile('dir/c.js', …)` does **not** make `./dir/c.js` appear in the glob map (it stays
  `['./dir/bar.js','./dir/foo.js']`); `removeFile` likewise does not shrink it.
- Editing a globbed `?url` `.txt` file's content keeps serving the old frozen bytes at its
  `/assets/<hash>.txt` URL.
- `.js` and `?raw` content edits _do_ update (those are ordinary graph edges).

## Steps to reproduce

**Manual:**

1. `cd playground/fbm-issue-5-glob-no-dir-watch && pnpm dev`, open http://localhost:5173/.
2. The page exposes the live glob state on `window.__GLOB__` (`eagerKeys()`, `rawValues()`,
   `fetchUrls()`).
3. Add a file `dir/c.js` (`export const msg = 'new'`). **Observe:** `window.__GLOB__.eagerKeys()`
   still returns only `./dir/bar.js` + `./dir/foo.js` — `c.js` never joins the set. (Editing
   `dir/foo.js`'s content _does_ update, confirming content-HMR works; only add/remove is frozen.)

**Automated (from the Vite repo root):**

```sh
pnpm test-serve fbm-issue-5-glob-no-dir-watch
```

Result: `Tests 3 passed | 2 expected fail (5)` — load + `.js`/`?raw` content edits pass; the `?url`
content-edit freeze and the add-file freeze are `test.fails`.

## Root cause

- **Plugin swap:** `plugins/importMetaGlob.ts:45-53` returns `nativeImportGlobPlugin(...)` when
  `environment.config.isBundled` (FBM client env is `isBundled:true`, `config.ts:952-953`), so the
  JS plugin's `transform`/`hotUpdate` (`importMetaGlob.ts:59-125`) go inactive.
- **Native plugin is transform-only:** Rolldown's `builtin:vite-import-glob` registers
  `HookUsage::Transform` only (`crates/rolldown_plugin_vite_import_glob/src/lib.rs:22-24`) and
  expands via a one-shot `walkdir::WalkDir` (`utils.rs:480`) — no directory watch, no
  `watchChange`/`hotUpdate`. So the glob set is frozen at the initial walk.
- **`?url` freeze:** the globbed `?url` value routes through the plain `vite:asset` url branch
  (`asset.ts:217-243`, no `addWatchFile`; the only `addWatchFile` is the `?raw` branch at `:206`) —
  the Issue 1/2 gap.

## Fix direction

Give the native `builtin:vite-import-glob` plugin directory-watch + a `watchChange`/`hotUpdate`
equivalent that re-runs the walkdir and re-invalidates the importing module on add/unlink (porting
`importMetaGlob.ts:111-125` into Rolldown); plus the Issue 2 `addWatchFile` fix for the `?url`
content-edit freeze.

## Related

[Issue 1](../fbm-issue-1-asset-hmr-freeze/README.md), [Issue 2](../fbm-issue-2-asset-no-watch/README.md).
See [`../FBM-ISSUES.md`](../FBM-ISSUES.md).
