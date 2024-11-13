# Migration from v5

## Environment API

As part of the new experimental [Environment API](/guide/api-environment.md), a big internal refactoring was needed. Vite 6 strives to avoid breaking changes to ensure most projects can quickly upgrade to the new major. We'll wait until a big portion of the ecosystem has moved to stabilize and start recommending the use of the new APIs. There may be some edge cases but these should only affect low level usage by frameworks and tools. We have worked with maintainers in the ecosystem to mitigate these differences before the release. Please [open an issue](https://github.com/vitejs/vite/issues/new?assignees=&labels=pending+triage&projects=&template=bug_report.yml) if you spot a regression.

Some internal APIs have been removed due to changes in Vite's implementation. If you were relying on one of them, please create a [feature request](https://github.com/vitejs/vite/issues/new?assignees=&labels=enhancement%3A+pending+triage&projects=&template=feature_request.yml).

## Vite Runtime API

The experimental Vite Runtime API evolved into the Module Runner API, released in Vite 6 as part of the new experimental [Environment API](/guide/api-environment). Given that the feature was experimental the removal of the previous API introduced in Vite 5.1 isn't a breaking change, but users will need to update their use to the Module Runner equivalent as part of migrating to Vite 6.

## General Changes

### Default value for `resolve.conditions`

This change does not affect users that did not configure [`resolve.conditions`](/config/shared-options#resolve-conditions) / [`ssr.resolve.conditions`](/config/ssr-options#ssr-resolve-conditions) / [`ssr.resolve.externalConditions`](/config/ssr-options#ssr-resolve-externalconditions).

In Vite 5, the default value for `resolve.conditions` was `[]` and some conditions were added internally. The default value for `ssr.resolve.conditions` was the value of `resolve.conditions`.

From Vite 6, some of the conditions are no longer added internally and need to be included in the config values.
The conditions that are no longer added internally for

- `resolve.conditions` are `['module', 'browser', 'development|production']`
- `ssr.resolve.conditions` are `['module', 'node', 'development|production']`

The default values for those options are updated to the corresponding values and `ssr.resolve.conditions` no longer uses `resolve.conditions` as the default value. Note that `development|production` is a special variable that is replaced with `production` or `development` depending on the value of `process.env.NODE_ENV`.

If you specified a custom value for `resolve.conditions` or `ssr.resolve.conditions`, you need to update it to include the new conditions.
For example, if you previously specified `['custom']` for `resolve.conditions`, you need to specify `['custom', 'module', 'browser', 'development|production']` instead.

### JSON stringify

In Vite 5, when [`json.stringify: true`](/config/shared-options#json-stringify) is set, [`json.namedExports`](/config/shared-options#json-namedexports) was disabled.

From Vite 6, even when `json.stringify: true` is set, `json.namedExports` is not disabled and the value is respected. If you wish to achieve the previous behavior, you can set `json.namedExports: false`.

Vite 6 also introduces a new default value for `json.stringify` which is `'auto'`, which will only stringify large JSON files. To disable this behavior, set `json.stringify: false`.

### Extended support of asset references in HTML elements

In Vite 5, only a few supported HTML elements were able to reference assets that will be processed and bundled by Vite, such as `<link href>`, `<img src>`, etc.

Vite 6 extends the support to even more HTML elements. The full list can be found at the [HTML features](/guide/features.html#html) docs.

To opt-out of HTML processing on certain elements, you can add the `vite-ignore` attribute on the element.

### postcss-load-config

[`postcss-load-config`](https://npmjs.com/package/postcss-load-config) has been updated to v6 from v4. [`tsx`](https://www.npmjs.com/package/tsx) or [`jiti`](https://www.npmjs.com/package/jiti) is now required to load TypeScript postcss config files instead of [`ts-node`](https://www.npmjs.com/package/ts-node). Also [`yaml`](https://www.npmjs.com/package/yaml) is now required to load YAML postcss config files.

### Sass now uses modern API by default

In Vite 5, the legacy API was used by default for Sass. Vite 5.4 added support for the modern API.

From Vite 6, the modern API is used by default for Sass. If you wish to still use the legacy API, you can set [`css.preprocessorOptions.sass.api: 'legacy'` / `css.preprocessorOptions.scss.api: 'legacy'`](/config/shared-options#css-preprocessoroptions). But note that the legacy API support will be removed in Vite 7.

To migrate to the modern API, see [the Sass documentation](https://sass-lang.com/documentation/breaking-changes/legacy-js-api/).

### Customize CSS output file name in library mode

In Vite 5, the CSS output file name in library mode was always `style.css` and cannot be easily changed through the Vite config.

From Vite 6, the default file name now uses `"name"` in `package.json` similar to the JS output files. If [`build.lib.fileName`](/config/build-options.md#build-lib) is set with a string, the value will also be used for the CSS output file name. To explicitly set a different CSS file name, you can use the new [`build.lib.cssFileName`](/config/build-options.md#build-lib) to configure it.

To migrate, if you had relied on the `style.css` file name, you should update references to it to the new name based on your package name. For example:

```json [package.json]
{
  "name": "my-lib",
  "exports": {
    "./style.css": "./dist/style.css" // [!code --]
    "./style.css": "./dist/my-lib.css" // [!code ++]
  }
}
```

If you prefer to stick with `style.css` like in Vite 5, you can set `build.lib.cssFileName: 'style'` instead.

## Advanced

There are other breaking changes which only affect few users.

- [[#15637] fix!: default `build.cssMinify` to `'esbuild'` for SSR](https://github.com/vitejs/vite/pull/15637)
  - [`build.cssMinify`](/config/build-options#build-cssminify) is now enabled by default even for SSR builds.
- [[#18070] feat!: proxy bypass with WebSocket](https://github.com/vitejs/vite/pull/18070)
  - `server.proxy[path].bypass` is now called for WebSocket upgrade requests and in that case, the `res` parameter will be `undefined`.
- [[#18209] refactor!: bump minimal terser version to 5.16.0](https://github.com/vitejs/vite/pull/18209)
  - Minimal supported terser version for [`build.minify: 'terser'`](/config/build-options#build-minify) was bumped to 5.16.0 from 5.4.0.
- [[#18231] chore(deps): update dependency @rollup/plugin-commonjs to v28](https://github.com/vitejs/vite/pull/18231)
  - [`commonjsOptions.strictRequires`](https://github.com/rollup/plugins/blob/master/packages/commonjs/README.md#strictrequires) is now `true` by default (was `'auto'` before).
    - This may lead to larger bundle sizes but will result in more deterministic builds.
    - If you are specifying a CommonJS file as an entry point, you may need additional steps. Read [the commonjs plugin documentation](https://github.com/rollup/plugins/blob/master/packages/commonjs/README.md#using-commonjs-files-as-entry-points) for more details.
- [[#18243] chore(deps)!: migrate `fast-glob` to `tinyglobby`](https://github.com/vitejs/vite/pull/18243)
  - Range braces (`{01..03}` ⇒ `['01', '02', '03']`) and incremental braces (`{2..8..2}` ⇒ `['2', '4', '6', '8']`) are no longer supported in globs.
- [[#18395] feat(resolve)!: allow removing conditions](https://github.com/vitejs/vite/pull/18395)
  - This PR not only introduces a breaking change mentioned above as "Default value for `resolve.conditions`", but also makes `resolve.mainFields` to not be used for no-externalized dependencies in SSR. If you were using `resolve.mainFields` and want to apply that to no-externalized dependencies in SSR, you can use [`ssr.resolve.mainFields`](/config/ssr-options#ssr-resolve-mainfields).
- [[#18493] refactor!: remove fs.cachedChecks option](https://github.com/vitejs/vite/pull/18493)
  - This opt-in optimization was removed due to edge cases when writing a file in a cached folder and immediately importing it.

## Migration from v4

Check the [Migration from v4 Guide](https://v5.vite.dev/guide/migration.html) in the Vite v5 docs first to see the needed changes to port your app to Vite 5, and then proceed with the changes on this page.
