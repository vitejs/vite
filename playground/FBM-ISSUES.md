# Vite Full Bundle Mode (FBM) — non-JS module HMR issue reproductions

Coalesced reproductions from an audit of **57 non-JS module types** under Vite **Full Bundle Mode**
(FBM = `experimental.bundledDev`, the Rolldown `bundledDev` dev server) for FBM Milestone 3
("HMR for non-JS modules"). 45 of the 57 types misbehaved; deduplicated, they collapse into **5
distinct, fileable issues** + **2 test-fixture artifacts that are NOT bugs** (see below).

Each `fbm-issue-*/` directory is a **standalone, runnable Vite playground app** whose only
non-default setting is `experimental.bundledDev: true`. Each has a `README.md` with
**expected behavior / current behavior / steps to reproduce**, and a spec so the bug reproduces in
one command. The original 57 per-type artifacts live alongside as `fbm-check-<type>/`.

## The issues

| #   | Reproduction                                                                 |                              GitHub                              | Severity  | Affected types | One-line                                                                               |
| --- | ---------------------------------------------------------------------------- | :--------------------------------------------------------------: | :-------: | :------------: | -------------------------------------------------------------------------------------- |
| 1   | [`fbm-issue-1-asset-hmr-freeze`](./fbm-issue-1-asset-hmr-freeze/README.md)   |      [#22596](https://github.com/vitejs/vite/issues/22596)       |  🔴 High  |     **35**     | Emitted/inlined assets freeze on HMR — served bytes + URL hash never update            |
| 2   | [`fbm-issue-2-asset-no-watch`](./fbm-issue-2-asset-no-watch/README.md)       | [#22596](https://github.com/vitejs/vite/issues/22596) (compound) | 🟠 Medium |       4        | `?inline`/`?url` asset + `.wasm` never `addWatchFile` → inline edit fires no HMR event |
| 4   | [`fbm-issue-4-html-stale-markup`](./fbm-issue-4-html-stale-markup/README.md) |                                —                                 |  🔴 High  |       1        | Editing `index.html` full-reloads but re-serves stale markup                           |
| 5   | [`fbm-issue-5-glob-no-dir-watch`](./fbm-issue-5-glob-no-dir-watch/README.md) | [#22596](https://github.com/vitejs/vite/issues/22596) (compound) | 🟠 Medium |       1        | Native `import.meta.glob` has no directory-watch / re-glob on add/remove               |
| 6   | [`fbm-issue-6-json5-build-fail`](./fbm-issue-6-json5-build-fail/README.md)   |                                —                                 | 🟠 Medium |       1        | `.json5` parsed as JavaScript → hard build failure (`PARSE_ERROR`)                     |

> Issue numbering follows the source audit's `SUMMARY.md`. **Issue 3 is intentionally absent** —
> see "Not bugs" below.

## The meta-pattern (#22596)

Issues **1, 2, and 5** all trace to the same two FBM design facts:

1. the client environment is `isBundled: true`, forcing the **build** asset path in dev
   (`packages/vite/src/node/config.ts:952-953`), and
2. the incremental HMR relay (`server/bundledDev.ts` `handleHmrOutput`) carries **JS patches only**
   — it skips `renderChunk` and re-emits no assets, and the `vite:asset` url/inline `load` branch
   never `addWatchFile`s.

One structural fix — **don't force the build asset path in FBM dev** (let `fileToUrl` use
`fileToDevUrl`) plus add the missing `addWatchFile` — removes the bulk of the asset family. Issues 4
and 6 are independent (HTML entry re-emit; `.json5` module-type routing in Rolldown).

## Not bugs — test-fixture artifacts (do NOT file)

Two clusters that the per-type audit flagged as "stale CSS" failures are **test artifacts**, not FBM
bugs. In each, the test's single-match `editFile` replace needle also appears **inside an explanatory
comment** that precedes the real rule, so the replace edits the comment and the real declaration is
never changed — the preprocessor then (correctly) recompiles the _unchanged_ value, which the test
misreads as "stale."

- **`pcss`** — flagged in the source audit: `color: pink` on a comment line (4) before the real rule
  (10).
- **`less` / `stylus`** — confirmed here the same way. `@color: blue` / `$color ?= blue` each appear
  **twice**: first inside a `//` comment quoting the Vite reference, then on the real declaration.
  The committed `fbm-check-less` / `fbm-check-stylus` HMR specs reproduce "stale" only because of
  that collision. **Re-running with a clean rule-targeting edit (`replaceAll`) recompiles fresh
  (`blue` → `red`)** — i.e. **Less/Stylus HMR works correctly under FBM.** This was verified in this
  worktree before deciding not to file.

So **all CSS / CSS-like preprocessors HMR correctly under FBM** (`css`, `scss`/`sass`, `less`,
`stylus`, `pcss`/`postcss`, `sss`) — joining the 12 passing types below.

## Passing under FBM (12 types — included as controls)

`css`, `scss`, `sss`, `css-modules`, `css-inline`, `css-raw`, `query-raw`, `json`,
`url-import-meta-url`, `worker`, `worker-new-url`, `sharedworker`.

`url-import-meta-url` and `worker` are the load-bearing **positive controls** for Issues 1 & 2: they
resolve to emitted assets _and_ HMR freshly, because they own an `addWatchFile` → invalidate →
re-bundle → re-emit pipeline that the plain `vite:asset` paths lack.

## How to reproduce

From the Vite repo root (this worktree):

```sh
# Automated — one issue (load passes; HMR/build failures are marked test.fails,
# so they "pass as expected-fail" while the bug is present):
pnpm test-serve fbm-issue-1-asset-hmr-freeze

# Manual — boot the app and watch it freeze in a browser:
cd playground/fbm-issue-1-asset-hmr-freeze && pnpm dev   # http://localhost:5173/
```

Each `README.md` has the exact per-issue manual + automated steps.

## Source

Derived from the `examine-vite-non-js-modules` audit: per-type verdicts and root-cause traces in
that task's `results/<type>.md`, coalesced in its `SUMMARY.md`. The 57 per-type playground artifacts
are the `playground/fbm-check-<type>/` directories.
