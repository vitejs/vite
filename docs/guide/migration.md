# Migration from v4

## Node.js Support

Vite no longer supports Node.js 14 / 16 / 17 / 19, which reached its EOL. Node.js 18 / 20+ is now required.

## Rollup 4

Vite is now using Rollup 4 which also brings along its breaking changes, in particular:

- Import assertions (`assertions` prop) has been renamed to import attributes (`attributes` prop).
- Acorn plugins are no longer supported.
- For Vite plugins, `this.resolve` `skipSelf` option is now `true` by default.
- For Vite plugins, `this.parse` now only supports the `allowReturnOutsideFunction` option for now.

Read the full breaking changes in [Rollup's release notes](https://github.com/rollup/rollup/releases/tag/v4.0.0) for build-related changes in `build.rollupOptions`.

## Deprecate CJS Node API

The CJS Node API of Vite is deprecated. When calling `require('vite')`, a deprecation warning is now logged. You should update your files or frameworks to import the ESM build of Vite instead.

In a basic Vite project, make sure:

1. The `vite.config.js` file content is using the ESM syntax.
2. The closest `package.json` file has `"type": "module"`, or use the `.mjs` extension, e.g. `vite.config.mjs`.

For other projects, there are a few general approaches:

- **Configure ESM as default, opt-in to CJS if needed:** Add `"type": "module"` in the project `package.json`. All `*.js` files are now interpreted as ESM and needs to use the ESM syntax. You can rename a file with the `.cjs` extension to keep using CJS instead.
- **Keep CJS as default, opt-in to ESM if needed:** If the project `package.json` does not have `"type": "module"`, all `*.js` files are interpreted as CJS. You can rename a file with the `.mjs` extension to use ESM instead.
- **Dynamically import Vite:** If you need to keep using CJS, you can dynamically import Vite using `import('vite')` instead. This requires your code to be written in an `async` context, but should still be manageable as Vite's API is mostly asynchronous.

See the [troubleshooting guide](/guide/troubleshooting.html#vite-cjs-node-api-deprecated) for more information.

## General Changes

### `worker.plugins` is now a function

In Vite 4, `worker.plugins` accepted an array of plugins (`(Plugin | Plugin[])[]`). From Vite 5, it needs to be configured as a function that returns an array of plugins (`() => (Plugin | Plugin[])[]`). This change is required so parallel worker builds run more consistently and predictably.

### Allow path containing `.` to fallback to index.html

In Vite 4, accessing a path containing `.` did not fallback to index.html even if `appType` is set to `'SPA'` (default).
From Vite 5, it will fallback to index.html.

Note that the browser will no longer show the 404 error message in the console if you point the image path to a non-existent file (e.g. `<img src="./file-does-not-exist.png">`).

### Manifest files are now generated in `.vite` directory by default

In Vite 4, the manifest files (`build.manifest`, `build.ssrManifest`) was generated in the root of `build.outDir` by default. From Vite 5, those will be generated in the `.vite` directory in the `build.outDir` by default.

### CLI shortcuts require an additional `Enter` press

CLI shortcuts, like `r` to restart the dev server, now require an additional `Enter` press to trigger the shortcut. For example, `r + Enter` to restart the dev server.

This change prevents Vite from swallowing and controlling OS-specific shortcuts, allowing better compatibility when combining the Vite dev server with other processes, and avoids the [previous caveats](https://github.com/vitejs/vite/pull/14342).

### Remove `--https` flag and `https: true`

`--https` flag sets `https: true`. This config was meant to be used together with the automatic https certification generation feature which [was dropped in Vite 3](https://v3.vitejs.dev/guide/migration.html#automatic-https-certificate-generation). This config no longer makes sense as it will make Vite start a HTTPS server without a certificate.
Both [`@vitejs/plugin-basic-ssl`](https://github.com/vitejs/vite-plugin-basic-ssl) and [`vite-plugin-mkcert`](https://github.com/liuweiGL/vite-plugin-mkcert) sets `https` setting regardless of the `https` value, so you can just remove `--https` and `https: true`.

### Remove `resolvePackageEntry` and `resolvePackageData` APIs

The `resolvePackageEntry` and `resolvePackageData` APIs are removed as they exposed Vite's internals and blocked potential Vite 4.3 optimizations in the past. These APIs can be replaced with third-party packages, for example:

- `resolvePackageEntry`: [`import.meta.resolve`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import.meta/resolve) or the [`import-meta-resolve`](https://github.com/wooorm/import-meta-resolve) package.
- `resolvePackageData`: Same as above, and crawl up the package directory to get the root `package.json`. Or use the community [`vitefu`](https://github.com/svitejs/vitefu) package.

```js
import { resolve } from 'import-meta-env'
import { findDepPkgJsonPath } from 'vitefu'
import fs from 'node:fs'

const pkg = 'my-lib'
const basedir = process.cwd()

// `resolvePackageEntry`:
const packageEntry = resolve(pkg, basedir)

// `resolvePackageData`:
const packageJsonPath = findDepPkgJsonPath(pkg, basedir)
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
```

## Removed Deprecated APIs

- Default exports of CSS files (e.g `import style from './foo.css'`): Use the `?inline` query instead
- `import.meta.globEager`: Use `import.meta.glob('*', { eager: true })` instead
- `ssr.format: 'cjs'` and `legacy.buildSsrCjsExternalHeuristics` ([#13816](https://github.com/vitejs/vite/discussions/13816))

## Advanced

There are some changes which only affect plugin/tool creators.

- [[#14119] refactor!: merge `PreviewServerForHook` into `PreviewServer` type](https://github.com/vitejs/vite/pull/14119)

Also there are other breaking changes which only affect few users.

- [[#14098] fix!: avoid rewriting this (reverts #5312)](https://github.com/vitejs/vite/pull/14098)
  - Top level `this` was rewritten to `globalThis` by default when building. This behavior is now removed.
- [[#14231] feat!: add extension to internal virtual modules](https://github.com/vitejs/vite/pull/14231)
  - Internal virtual modules' id now has an extension (`.js`).
- [[#14583] refactor!: remove exporting internal APIs](https://github.com/vitejs/vite/pull/14583)
  - Removed accidentally exported internal APIs: `isDepsOptimizerEnabled` and `getDepOptimizationConfig`
  - Removed exported internal types: `DepOptimizationResult`, `DepOptimizationProcessing`, and `DepsOptimizer`
  - Renamed `ResolveWorkerOptions` type to `ResolvedWorkerOptions`
- [[#5657] fix: return 404 for resources requests outside the base path](https://github.com/vitejs/vite/pull/5657)
  - In the past, Vite responded to requests outside the base path without `Accept: text/html`, as if they were requested with the base path. Vite no longer does that and responds with 404 instead.

## Migration from v3

Check the [Migration from v3 Guide](https://v4.vitejs.dev/guide/migration.html) in the Vite v4 docs first to see the needed changes to port your app to Vite v4, and then proceed with the changes on this page.
