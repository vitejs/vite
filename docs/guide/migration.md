# Migration from v4

## Node.js Support

Vite no longer supports Node.js 14 / 16 / 17 / 19, which reached its EOL. Node.js 18 / 20+ is now required.

## Deprecate CJS node API

TODO: add some description https://github.com/vitejs/vite/pull/14278

## General Changes

### Allow path containing `.` to fallback to index.html

In Vite 4, accessing a path containing `.` did not fallback to index.html even if `appType` is set to `'SPA'` (default).
From Vite 5, it will fallback to index.html.

### Manifest files are now generated in `.vite` directory by default

In Vite 4, the manifest files (`build.manifest`, `build.ssrManifest`) was generated in the root of `build.outDir` by default. From Vite 5, those will be generated in the `.vite` directory in the `build.outDir` by default.

### Every shotcuts need to be followed with an `Enter` press

TODO: add some description https://github.com/vitejs/vite/pull/14342

## Removed deprecated things

- Default exports of CSS files (e.g `import style from './foo.css'`): Use the `?inline` query instead
- `import.meta.globEager`: Use `import.meta.glob('*', { eager: true })` instead

## Advanced

There are some changes which only affect plugin/tool creators.

- [[#14119] refactor!: merge `PreviewServerForHook` into `PreviewServer` type](https://github.com/vitejs/vite/pull/14119)

Also there are other breaking changes which only affect few users.

- [[#14098] fix!: avoid rewriting this (reverts #5312)](https://github.com/vitejs/vite/pull/14098)
  - Top level `this` was rewritten to `globalThis` by default when building. This behavior is now removed.
- [[#14231] feat!: add extension to internal virtual modules](https://github.com/vitejs/vite/pull/14231)
  - Internal virtual modules' id now has an extension (`.js`).

## Migration from v3

Check the [Migration from v3 Guide](https://v4.vitejs.dev/guide/migration.html) in the Vite v4 docs first to see the needed changes to port your app to Vite v4, and then proceed with the changes on this page.
