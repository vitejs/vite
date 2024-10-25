# Migration from v5

## Environment API

As part of the new experimental [Environment API](/guide/api-environment.md), a big internal refactoring was needed. Vite 6 strives to avoid breaking changes to ensure most projects can quickly upgrade to the new major. We'll wait until a big portion of the ecosystem has moved to stabilize and start recommending the use of the new APIs. There may be some edge cases but these should only affect low level usage by frameworks and tools. We have worked with maintainers in the ecosystem to mitigate these differences before the release. Please [open an issue](https://github.com/vitejs/vite/issues/new?assignees=&labels=pending+triage&projects=&template=bug_report.yml) if you spot a regression.

Some internal APIs have been removed due to changes in Vite's implementation. If you were relying on one of them, please create a [feature request](https://github.com/vitejs/vite/issues/new?assignees=&labels=enhancement%3A+pending+triage&projects=&template=feature_request.yml).

## Vite Runtime API

The experimental Vite Runtime API evolved into the Module Runner API, released in Vite 6 as part of the new experimental [Environment API](/guide/api-environment). Given that the feature was experimental the removal of the previous API introduced in Vite 5.1 isn't a breaking change, but users will need to update their use to the Module Runner equivalent as part of migrating to Vite 6.

## General Changes

### JSON stringify

In Vite 5, when [`json.stringify: true`](/config/shared-options#json-stringify) is set, [`json.namedExports`](/config/shared-options#json-namedexports) was disabled.

From Vite 6, even when `json.stringify: true` is set, `json.namedExports` is not disabled and the value is respected. If you wish to achieve the previous behavior, you can set `json.namedExports: false`.

Vite 6 also introduces a new default value for `json.stringify` which is `'auto'`, which will only stringify large JSON files. To disable this behavior, set `json.stringify: false`.

### Sass now uses modern API by default

In Vite 5, the legacy API was used by default for Sass. Vite 5.4 added support for the modern API.

From Vite 6, the modern API is used by default for Sass. If you wish to still use the legacy API, you can set [`css.preprocessorOptions.sass.api: 'legacy'` / `css.preprocessorOptions.scss.api: 'legacy'`](/config/shared-options#css-preprocessoroptions). But note that the legacy API support will be removed in Vite 7.

To migrate to the modern API, see [the Sass documentation](https://sass-lang.com/documentation/breaking-changes/legacy-js-api/).

## Advanced

There are other breaking changes which only affect few users.

- [[#15637] fix!: default `build.cssMinify` to `'esbuild'` for SSR](https://github.com/vitejs/vite/pull/15637)
  - [`build.cssMinify`](/config/build-options#build-cssminify) is now enabled by default even for SSR builds.
- [[#18209] refactor!: bump minimal terser version to 5.16.0](https://github.com/vitejs/vite/pull/18209)
  - Minimal supported terser version for [`build.minify: 'terser'`](/config/build-options#build-minify) was bumped to 5.16.0 from 5.4.0.
- [[#18231] chore(deps): update dependency @rollup/plugin-commonjs to v28](https://github.com/vitejs/vite/pull/18231)
  - [`commonjsOptions.strictRequires`](https://github.com/rollup/plugins/blob/master/packages/commonjs/README.md#strictrequires) is now `true` by default (was `'auto'` before).
- [[#18243] chore(deps)!: migrate `fast-glob` to `tinyglobby`](https://github.com/vitejs/vite/pull/18243)
  - Range braces (`{01..03}` ⇒ `['01', '02', '03']`) and incremental braces (`{2..8..2}` ⇒ `['2', '4', '6', '8']`) are no longer supported in globs.

## Migration from v4

Check the [Migration from v4 Guide](https://v5.vite.dev/guide/migration.html) in the Vite v5 docs first to see the needed changes to port your app to Vite 5, and then proceed with the changes on this page.
