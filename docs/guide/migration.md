# Migration from v2

## Node Support

Vite no longer supports Node v12, which reached its EOL. Node 14.6+ is now required.

## Modern Browser Baseline change

The production bundle assumes support for modern JavaScript. By default, Vite targets browsers which support the [native ES Modules](https://caniuse.com/es6-module) and [native ESM dynamic import](https://caniuse.com/es6-module-dynamic-import) and [`import.meta`](https://caniuse.com/mdn-javascript_statements_import_meta):

- Chrome >=87
- Firefox >=78
- Safari >=13
- Edge >=88

A small fraction of users will now require using [@vitejs/plugin-legacy](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy), which will automatically generate legacy chunks and corresponding ES language feature polyfills.

## Config Options Changes

- The following options that were already deprecated in v2 have been removed:

  - `alias` (switch to [`resolve.alias`](../config/shared-options.md#resolvealias))
  - `dedupe` (switch to [`resolve.dedupe`](../config/shared-options.md#resolvededupe))
  - `build.base` (switch to [`base`](../config/shared-options.md#base))
  - `build.brotliSize` (switch to [`build.reportCompressedSize`](../config/build-options.md#build-reportcompressedsize))
  - `build.cleanCssOptions` (Vite now uses esbuild for CSS minification)
  - `build.polyfillDynamicImport` (use [`@vitejs/plugin-legacy`](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy) for browsers without dynamic import support)
  - `optimizeDeps.keepNames` (switch to [`optimizeDeps.esbuildOptions.keepNames`](../config/dep-optimization-options.md#optimizedepsesbuildoptions))

## Dev Server Changes

Vite's default dev server port is now 5173. You can use [`server.port`](../config/server-options.md#server-port) to set it to 3000.

Vite optimizes dependencies with esbuild to both convert CJS-only deps to ESM and to reduce the number of modules the browser needs to request. In v3, the default strategy to discover and batch dependencies has changed. Vite no longer pre-scans user code with esbuild to get an initial list of dependencies on cold start. Instead, it delays the first dependency optimization run until every imported user module on load is processed.

To get back the v2 strategy, you can use [`optimizeDeps.devScan`](../config/dep-optimization-options.md#optimizedepsdevscan).

## Build Changes

In v3, Vite uses esbuild to optimize dependencies by default. Doing so, it removes one of the most significant differences between dev and prod present in v2. Because esbuild converts CJS-only dependencies to ESM, [`@rollupjs/plugin-commonjs`](https://github.com/rollup/plugins/tree/master/packages/commonjs) is no longer used.

If you need to get back to the v2 strategy, you can use [`optimizeDeps.disabled: 'build'`](../config/dep-optimization-options.md#optimizedepsdisabled).

## SSR Changes

Vite v3 uses ESM for the SSR build by default. When using ESM, the [SSR externalization heuristics](https://vitejs.dev/guide/ssr.html#ssr-externals) are no longer needed. By default, all dependencies are externalized. You can use [`ssr.noExternal`](../config/ssr-options.md#ssrnoexternal) to control what dependencies to include in the SSR bundle.

If using ESM for SSR isn't possible in your project, you can set `ssr.format: 'cjs'` to generate a CJS bundle. In this case, the same externalization strategy of Vite v2 will be used.

## General Changes

- JS file extensions in SSR and lib mode now use a valid extension (`js`, `mjs`, or `cjs`) for output JS entries and chunks based on their format and the package type.

### `import.meta.glob`

- [Raw `import.meta.glob`](features.md#glob-import-as) switched from `{ assert: { type: 'raw' }}` to `{ as: 'raw' }`
- Keys of `import.meta.glob` are now relative to the current module.

  ```diff
  // file: /foo/index.js
  const modules = import.meta.glob('../foo/*.js')

  // transformed:
  const modules = {
  -  '../foo/bar.js': () => {}
  +  './bar.js': () => {}
  }
  ```

- When using an alias with `import.meta.glob`, the keys are always absolute.
- `import.meta.globEager` is now deprecated. Use `import.meta.glob('*', { eager: true })` instead.

### WebAssembly support

`import init from 'example.wasm'` syntax is dropped to prevent future collision with ["ESM integration for Wasm"](https://github.com/WebAssembly/esm-integration).
You can use `?init` which is similar to the previous behavior.

```diff
-import init from 'example.wasm'
+import init from 'example.wasm?init'

-init().then((instance) => {
+init().then(({ exports }) => {
  exports.test()
})
```

## Advanced

There are some changes which only affects plugin/tool creators.

- [[#5868] refactor: remove deprecated api for 3.0](https://github.com/vitejs/vite/pull/5868)
  - `printHttpServerUrls` is removed
  - `server.app`, `server.transformWithEsbuild` are removed
  - `import.meta.hot.acceptDeps` is removed
- [[#7995] chore: do not fixStacktrace](https://github.com/vitejs/vite/pull/7995)
  - `ssrLoadModule`'s `fixStacktrace` option's default is now `false`
- [[#8178] feat!: migrate to ESM](https://github.com/vitejs/vite/pull/8178)
  - `formatPostcssSourceMap` is now async
  - `resolvePackageEntry`, `resolvePackageData` are no longer available from CJS build (dynamic import is needed to use in CJS)

Also there are other breaking changes which only affect few users.

- [[#5018] feat: enable `generatedCode: 'es2015'` for rollup build](https://github.com/vitejs/vite/pull/5018)
  - Transpile to ES5 is now necessary even if the user code only includes ES5.
- [[#7877] fix: vite client types](https://github.com/vitejs/vite/pull/7877)
  - `/// <reference lib="dom" />` is removed from `vite/client.d.ts`. `{ "lib": ["dom"] }` or `{ "lib": ["webworker"] }` is necessary in `tsconfig.json`.
- [[#8280] feat: non-blocking esbuild optimization at build time](https://github.com/vitejs/vite/pull/8280)
  - `server.force` option was removed in favor of `force` option.

## Migration from v1

Check the [Migration from v1 Guide](https://v2.vitejs.dev/guide/migration.html) in the Vite v2 docs first to see the needed changes to port your app to Vite v2, and then proceed with the changes on this page.
