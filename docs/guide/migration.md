# Migration from v6

## Node.js Support

Vite no longer supports Node.js 18, which reached its EOL. Node.js 20.19+ / 22.12+ is now required.

## General Changes

### Removed Sass legacy API support

As planned, support for the Sass legacy API is removed. Vite now only supports the modern API.

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

## Migration from v5

Check the [Migration from v5 Guide](https://v6.vite.dev/guide/migration.html) in the Vite v6 docs first to see the needed changes to port your app to Vite 6, and then proceed with the changes on this page.
