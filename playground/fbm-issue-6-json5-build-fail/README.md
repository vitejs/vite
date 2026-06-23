# FBM Issue 6 — `.json5` is parsed as JavaScript → hard build failure

> Part of the Full Bundle Mode (FBM = `experimental.bundledDev`) non-JS-module HMR audit.
> Standalone runnable Vite playground app; only non-default setting is
> `experimental.bundledDev: true`. Index: [`../FBM-ISSUES.md`](../FBM-ISSUES.md).

- **GitHub:** _not yet filed_
- **Severity:** 🟠 Medium
- **Affected module types:** **1** (`json5`)

## Summary

Under FBM, importing a `.json5` file makes the dev bundle **hard-fail**. `.json5` is never routed
to the JSON module type, so Rolldown's default OXC **JavaScript** parser tries to parse the
relaxed-JSON file as JS and errors with `[PARSE_ERROR] Expected a semicolon`. The page shows the
FBM build-error overlay and never loads. (Plain `.json` works — this is `.json5`-specific.)

## Expected behavior

`.json5` imports as a JS module — default export = the parsed object, plus a named export per
top-level key — the same as `.json`; edits trigger a full reload. Vite already declares `.json5`
as a JSON lang (`jsonLangs` = `\.(?:json|json5)`, `plugins/json.ts:16`).

## Current behavior (FBM)

- The dev bundle fails on initial load; the page shows the FBM build-error overlay and `.app`
  never becomes `json5 loaded`.
- Under `DEBUG=vite:full-bundle-mode`:
  `[PARSE_ERROR] Expected a semicolon or an implicit semicolon after a statement, but found none
╭─[ test.json5:5:6 ]` — the OXC JS parser choking on the `.json5` body (it reads `hello:` /
  `hmr:` as labeled statements and demands semicolons).
- A `.json5` file containing **plain standard-JSON** content _also_ fails to bundle → the gap is
  the missing `.json5` → JSON **routing**, not the JSON5 dialect.

## Steps to reproduce

**Manual:**

1. `cd playground/fbm-issue-6-json5-build-fail && pnpm dev`, open http://localhost:5173/.
2. **Observe:** a red build-error overlay (`Expected a semicolon … test.json5`); the page never
   renders (`.app` stays blank — `main.js` never runs).

**Automated (from the Vite repo root):**

```sh
pnpm test-serve fbm-issue-6-json5-build-fail
```

Result: `Tests 2 expected fail (2)` — both halves are `test.fails` because the module never bundles,
so the page never reaches the assertions. (When fixed, both flip back to `test`.)

> `test.json5` uses genuine JSON5-only syntax (a line comment, an unquoted key, single-quoted
> values, a trailing comma) — none of which `JSON.parse` accepts — so a passing load would require
> a real JSON5 parse.

## Root cause

Rolldown side (Vite wires `nativeJsonPlugin` at `plugins/index.ts:127`, but the routing happens in
Rolldown):

1. **Routing (decisive):** the default `module_types` map has only `("json", ModuleType::Json)` —
   **no `json5`** (`crates/rolldown/src/utils/prepare_build_context.rs:233`), so
   `get_module_loader_from_file_extension` returns `None` for `*.json5`
   (`crates/rolldown/src/utils/load_source.rs:148-159`) and the file falls through to the default
   JS/OXC parser → `PARSE_ERROR`.
2. **Plugin gating + parser (secondary):** `ViteJsonPlugin.transform` gates on `is_json_ext`, which
   matches `.json` only (`crates/rolldown_plugin_vite_json/src/utils.rs:2-11`); and it parses via
   standard-JSON-only `serde_json::from_str` (`crates/rolldown_plugin_vite_json/src/lib.rs:53,71`).
   There is zero `json5` handling anywhere in Rolldown.

## Fix direction

Add `("json5", ModuleType::Json)` to Rolldown's default `module_types`
(`prepare_build_context.rs:233`), extend `is_json_ext` to accept `.json5`, and swap
`serde_json::from_str` for a JSON5-capable parser (e.g. `json5` / `serde_json5`) so the relaxed
syntax actually parses. All three are needed (routing alone still hits the standard-JSON parser).

## Related

Plain `.json` passes ([#6332](https://github.com/vitejs/vite/issues/6332) closed). This is a hard
build failure, distinct from the asset and (non-bug) preprocessor families — see
[`../FBM-ISSUES.md`](../FBM-ISSUES.md).
