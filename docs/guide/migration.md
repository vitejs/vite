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

## Rework `define` and `import.meta.env.*` replacement strategy

In Vite 4, the `define` and `import.meta.env.*` features use different replacement strategies in dev and build:

- In dev, both features are injected as global variables to `globalThis` and `import.meta` respectively.
- In build, both features are statically replaced with a regex.

This results in a dev and build inconsistency when trying to access the variables, and sometimes even caused failed builds. For example:

```js
// vite.config.js
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify('1.0.0'),
  },
})
```

```js
const data = { __APP_VERSION__ }
// dev: { __APP_VERSION__: "1.0.0" } ✅
// build: { "1.0.0" } ❌

const docs = 'I like import.meta.env.MODE'
// dev: "I like import.meta.env.MODE" ✅
// build: "I like "production"" ❌
```

Vite 5 fixes this by using `esbuild` to handle the replacements in builds, aligning with the dev behaviour.

This change should not affect most setups, as it's already documented that `define` values should follow esbuild's syntax:

> To be consistent with esbuild behavior, expressions must either be a JSON object (null, boolean, number, string, array, or object) or a single identifier.

However, if you prefer to keep statically replacing values directly, you can use [`@rollup/plugin-replace`](https://github.com/rollup/plugins/tree/master/packages/replace).

## General Changes

### SSR externalized modules value now matches production

In Vite 4, SSR externalized modules are wrapped with `.default` and `.__esModule` handling for better interoperability, but it doesn't match the production behaviour when loaded by the runtime environment (e.g. Node.js), causing hard-to-catch inconsistencies. By default, all direct project dependencies are SSR externalized.

Vite 5 now removes the `.default` and `.__esModule` handling to match the production behaviour. In practice, this shouldn't affect properly-packaged dependencies, but if you encounter new issues loading modules, you can try these refactors:

```js
// Before:
import { foo } from 'bar'

// After:
import _bar from 'bar'
const { foo } = _bar
```

```js
// Before:
import foo from 'bar'

// After:
import * as _foo from 'bar'
const foo = _foo.default
```

Note that these changes matches the Node.js behaviour, so you can also run the imports in Node.js to test it out. If you prefer to stick with the previous behaviour, you can set `legacy.proxySsrExternalModules` to `true`.

### `worker.plugins` is now a function

In Vite 4, `worker.plugins` accepted an array of plugins (`(Plugin | Plugin[])[]`). From Vite 5, it needs to be configured as a function that returns an array of plugins (`() => (Plugin | Plugin[])[]`). This change is required so parallel worker builds run more consistently and predictably.

### Allow path containing `.` to fallback to index.html

In Vite 4, accessing a path in dev containing `.` did not fallback to index.html even if `appType` is set to `'spa'` (default). From Vite 5, it will fallback to index.html.

Note that the browser will no longer show a 404 error message in the console if you point the image path to a non-existent file (e.g. `<img src="./file-does-not-exist.png">`).

### Align dev and preview HTML serving behaviour

In Vite 4, the dev and preview servers serve HTML based on its directory structure and trailing slash differently. This causes inconsistencies when testing your built app. Vite 5 refactors into a single behaviour like below, given the following file structure:

```
├── index.html
├── file.html
└── dir
    └── index.html
```

| Request           | Before (dev)                 | Before (preview)  | After (dev & preview)        |
| ----------------- | ---------------------------- | ----------------- | ---------------------------- |
| `/dir/index.html` | `/dir/index.html`            | `/dir/index.html` | `/dir/index.html`            |
| `/dir`            | `/index.html` (SPA fallback) | `/dir/index.html` | `/dir.html` (SPA fallback)   |
| `/dir/`           | `/dir/index.html`            | `/dir/index.html` | `/dir/index.html`            |
| `/file.html`      | `/file.html`                 | `/file.html`      | `/file.html`                 |
| `/file`           | `/index.html` (SPA fallback) | `/file.html`      | `/file.html`                 |
| `/file/`          | `/index.html` (SPA fallback) | `/file.html`      | `/index.html` (SPA fallback) |

### Manifest files are now generated in `.vite` directory by default

In Vite 4, the manifest files (`build.manifest`, `build.ssrManifest`) was generated in the root of `build.outDir` by default. From Vite 5, those will be generated in the `.vite` directory in the `build.outDir` by default.

### CLI shortcuts require an additional `Enter` press

CLI shortcuts, like `r` to restart the dev server, now require an additional `Enter` press to trigger the shortcut. For example, `r + Enter` to restart the dev server.

This change prevents Vite from swallowing and controlling OS-specific shortcuts, allowing better compatibility when combining the Vite dev server with other processes, and avoids the [previous caveats](https://github.com/vitejs/vite/pull/14342).

### Update `experimentalDecorators` and `useDefineForClassFields` TypeScript behaviour

Vite 5 uses esbuild 0.19 and removes the compatibility layer for esbuild 0.18, which changes how `experimentalDecorators` and `useDefineForClassFields` are handled.

- **`experimentalDecorators` is not enabled by default**

  You need to set `compilerOptions.experimentalDecorators` to `true` in `tsconfig.json` to use decorators.

- **`useDefineForClassFields` defaults depend on the TypeScript `target` value**

  If `target` is not `ESNext` or `ES2022` or newer, or if there's no `tsconfig.json` file, `useDefineForClassFields` will default to `false` which can be problematic with the default `esbuild.target` value of `esnext`. It may transpile to [static initialization blocks](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Static_initialization_blocks#browser_compatibility) which may not be supported in your browser.

  As such, it is recommended to set `target` to `ESNext` or `ES2022` or newer, or set `useDefineForClassFields` to `true` explicitly when configuring `tsconfig.json`.

```jsonc
{
  "compilerOptions": {
    // Set true if you use decorators
    "experimentalDecorators": true,
    // Set true if you see parsing errors in your browser
    "useDefineForClassFields": true
  }
}
```

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
- `server.middlewareMode: 'ssr'` and `server.middlewareMode: 'html'`: Use [`appType`](/config/shared-options.md#apptype) + [`server.middlewareMode: true`](/config/server-options.md#server-middlewaremode) instead ([#8452](https://github.com/vitejs/vite/pull/8452))

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
- [[#14723] fix(resolve)!: remove special .mjs handling](https://github.com/vitejs/vite/pull/14723)
  - In the past, when a library `"exports"` field maps to an `.mjs` file, Vite will still try to match the `"browser"` and `"module"` fields to fix compatibility with certain libraries. This behavior is now removed to align with the exports resolution algorithm.
- [[#14733] feat(resolve)!: remove `resolve.browserField`](https://github.com/vitejs/vite/pull/14733)
  - `resolve.browserField` has been deprecated since Vite 3 in favour of an updated default of `['browser', 'module', 'jsnext:main', 'jsnext']` for `resolve.mainFields`.

## Migration from v3

Check the [Migration from v3 Guide](https://v4.vitejs.dev/guide/migration.html) in the Vite v4 docs first to see the needed changes to port your app to Vite v4, and then proceed with the changes on this page.
