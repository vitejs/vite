# Migration from v6

## Node.js Support

Vite no longer supports Node.js 18, which reached its EOL. Node.js 20.19+ / 22.12+ is now required.

## Default Browser Target change

The default browser value of `build.target` is updated to a newer browser.

- Chrome 87 → 107
- Edge 88 → 107
- Firefox 78 → 104
- Safari 14.0 → 16.0

These browser versions align with [Baseline](https://web-platform-dx.github.io/web-features/) Widely Available feature sets as of 2025-05-01. In other words, they were all released before 2022-11-01.

In Vite 5, the default target was named `'modules'`, but this is no longer available. Instead, a new default target `'baseline-widely-available'` is introduced.

## General Changes

### Removed Sass legacy API support

As planned, support for the Sass legacy API is removed. Vite now only supports the modern API. You can remove the `css.preprocessorOptions.sass.api` / `css.preprocessorOptions.scss.api` option.

## Removed deprecated features

- `splitVendorChunkPlugin` (deprecated in v5.2.7)
  - This plugin was originally provided to ease migration to Vite v2.9.
  - The `build.rollupOptions.output.manualChunks` option can be used to control the chunking behavior if needed.
- Hook-level `enforce` / `transform` for `transformIndexHtml` (deprecated in v4.0.0)
  - It was changed to align the interface with [Rollup's object hooks](https://rollupjs.org/plugin-development/#build-hooks:~:text=Instead%20of%20a%20function%2C%20hooks%20can%20also%20be%20objects.).
  - `order` should be used instead of `enforce`, and `handler` should be used instead of `transform`.

## Advanced

There are other breaking changes which only affect few users.

- [[#19979] chore: declare version range for peer dependencies](https://github.com/vitejs/vite/pull/19979)
  - Specified the peer dependencies version range for CSS preprocessors.
- [[#20013] refactor: remove no-op `legacy.proxySsrExternalModules`](https://github.com/vitejs/vite/pull/20013)
  - `legacy.proxySsrExternalModules` property had no effect since Vite 6. It is now removed.
- [[#19985] refactor!: remove deprecated no-op type only properties](https://github.com/vitejs/vite/pull/19985)
  - The following unused properties are now removed: `ModuleRunnerOptions.root`, `ViteDevServer._importGlobMap`, `ResolvePluginOptions.isFromTsImporter`, `ResolvePluginOptions.getDepsOptimizer`, `ResolvePluginOptions.shouldExternalize`, `ResolvePluginOptions.ssrConfig`
- [[#19986] refactor: remove deprecated env api properties](https://github.com/vitejs/vite/pull/19986)
  - These properties were deprecated from the beginning. It is now removed.
- [[#19987] refactor!: remove deprecated `HotBroadcaster` related types](https://github.com/vitejs/vite/pull/19987)
  - These types were introduced as part of the now-deprecated Runtime API. It is now removed: `HMRBroadcaster`, `HMRBroadcasterClient`, `ServerHMRChannel`, `HMRChannel`
- [[#19996] fix(ssr)!: don't access `Object` variable in ssr transformed code](https://github.com/vitejs/vite/pull/19996)
  - `__vite_ssr_exportName__` is now required for the module runner runtime context.
- [[#20045] fix: treat all `optimizeDeps.entries` values as globs](https://github.com/vitejs/vite/pull/20045)
  - `optimizeDeps.entries` now does not receive literal string paths. Instead, it always receives globs.
- [[#20222] feat: apply some middlewares before `configureServer` hook](https://github.com/vitejs/vite/pull/20222), [[#20224] feat: apply some middlewares before `configurePreviewServer` hook](https://github.com/vitejs/vite/pull/20224)
  - Some middlewares are now applied before the `configureServer` / `configurePreviewServer` hook. Note that if you don't expect a certain route to apply the [`server.cors`](../config/server-options.md#server-cors) / [`preview.cors`](../config/preview-options.md#preview-cors) option, make sure to remove the related headers from the response.

## Migration from v5

Check the [Migration from v5 Guide](https://v6.vite.dev/guide/migration.html) in the Vite v6 docs first to see the needed changes to port your app to Vite 6, and then proceed with the changes on this page.
