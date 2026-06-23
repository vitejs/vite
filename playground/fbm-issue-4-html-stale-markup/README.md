# FBM Issue 4 — Editing `index.html` fires a full reload but re-serves stale markup

> Part of the Full Bundle Mode (FBM = `experimental.bundledDev`) non-JS-module HMR audit.
> Standalone runnable Vite playground app; only non-default setting is
> `experimental.bundledDev: true`. Index: [`../FBM-ISSUES.md`](../FBM-ISSUES.md).

- **GitHub:** _not yet filed_
- **Severity:** 🔴 High
- **Affected module types:** **1** (`html`)

## Summary

Under FBM, editing the dev-server entry `index.html` triggers a full page reload, but the reloaded
page **permanently serves the stale pre-edit markup** — the new markup never appears. You get a
reload with none of the content change.

## Expected behavior

Editing `index.html` markup full-reloads and the reloaded page shows the **new** markup — exactly
as in normal (non-FBM) Vite dev.

## Current behavior (FBM)

- **Load works:** the served `index.html` renders its own markup
  (`<button class="counter">Counter 0</button>`) and its linked entry script runs (`.app` text
  becomes `html entry loaded`).
- **After editing `Counter 0` → `Compteur 0`:** a full reload **does** fire, but the reloaded
  document still shows `Counter 0` — forever. Under `DEBUG=vite:full-bundle-mode` the edit logs
  `ignored file change for …/index.html`, then later `TRIGGER: access to stale bundle, triggered
bundle re-generation` (the reload), but the regenerated bundle never carries the edit.

## Steps to reproduce

**Manual:**

1. `cd playground/fbm-issue-4-html-stale-markup && pnpm dev`, open http://localhost:5173/.
2. The page shows a button reading `Counter 0` and `.app` = `html entry loaded`.
3. Edit `index.html`: change `Counter 0` → `Compteur 0`.
4. **Observe:** the page reloads, but the button still reads `Counter 0`. The new markup never
   appears (restarting `pnpm dev` does pick it up).

**Automated (from the Vite repo root):**

```sh
pnpm test-serve fbm-issue-4-html-stale-markup
```

Result: `Tests 1 passed | 1 expected fail (2)`. The load test passes; the HMR test (`test.fails`)
documents the freeze — it confirms the reload fires yet the markup poll to `Compteur 0` times out.

## Root cause

A three-part chain, all on the Vite side:

1. Under FBM `vite:build-html` compiles `index.html` into a bundled JS entry
   (`plugins/html.ts:411`, `:433-434`), and the indexHtml middleware serves `.html` from the
   bundle's `memoryFiles` (`server/middlewares/indexHtml.ts:467-499`) rather than a fresh
   `transformIndexHtml`. So fresh markup only surfaces if the **bundle** re-emits the HTML.
2. The html-entry content change is classified as a **`Noop`**, so FBM logs `ignored file change`
   and returns early **without** calling `handleHmrOutput` (`server/bundledDev.ts:149-151`) — the
   HTML in `memoryFiles` is never re-derived from the edited source.
3. The dedicated `.html` → full-reload path is unreachable: `handleHMRUpdate` early-returns for
   `bundledDev` (`server/hmr.ts:463-466`) _before_ the `.html` branch (`:624-638`). The reload that
   does fire comes from the generic stale-bundle path (`bundledDev.ts:300-308`).

## Fix direction

Make FBM re-emit the HTML on an `index.html` content change — either have the dev engine **not**
classify the html-entry source change as a `Noop` (re-run the html entry transform/`generateBundle`
so regenerated `memoryFiles` HTML carries the edit), or special-case `.html` to force a re-bundle +
full reload (restoring non-FBM `.html` behavior, which is itself a coarse full reload — faithful,
not a regression).

## Related

See [`../FBM-ISSUES.md`](../FBM-ISSUES.md).
