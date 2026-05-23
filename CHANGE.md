# Speechify

## Security

### [SECURITY] Redact leaked secrets from git history

- Scanned all commits using `gitleaks`; detected 2 leaked secrets across 10,014 commits
- Rewrote full git history (10,170 commits) using `git filter-repo --replace-text`
  to replace both secrets with `***REMOVED***`
- Repacked all 113,518 objects; history is now clean
- **Action required:** `origin` remote was removed by `git filter-repo` — re-add and force-push
- **Action required:** Rotate/invalidate both leaked secrets if still active

## Chore

- **tooling:** Added `knip.json` configuration to suppress false positives
  from playground templates, public API exports, and dynamically loaded
  playground dependencies

  ## Chore

- **deps:** Removed unused dependencies `rollup-plugin-license` and
  `sass-embedded` from `packages/vite`

## Chore

- **build:** Removed duplicate `export {}` block for `toOutputFilePathWithoutRuntime`,
  `toOutputFilePathInCss`, and `toOutputFilePathInHtml` in `packages/vite/src/node/build.ts`
- **tooling:** Removed redundant patterns from `knip.json` that knip already
  handles natively (template globs, binary detection, auto-detected entry points)
