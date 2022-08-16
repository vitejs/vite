# Build Options

## build.target

- **Type:** `string | string[]`
- **Default:** `'modules'`
- **Related:** [Browser Compatibility](/guide/build#browser-compatibility)

Browser compatibility target for the final bundle. The default value is a Vite special value, `'modules'`, which targets browsers with [native ES Modules](https://caniuse.com/es6-module), [native ESM dynamic import](https://caniuse.com/es6-module-dynamic-import), and [`import.meta`](https://caniuse.com/mdn-javascript_operators_import_meta) support.

Another special value is `'esnext'` - which assumes native dynamic imports support and will transpile as little as possible:

- If the [`build.minify`](#build-minify) option is `'terser'`, `'esnext'` will be forced down to `'es2021'`.
- In other cases, it will perform no transpilation at all.

The transform is performed with esbuild and the value should be a valid [esbuild target option](https://esbuild.github.io/api/#target). Custom targets can either be a ES version (e.g. `es2015`), a browser with version (e.g. `chrome58`), or an array of multiple target strings.

Note the build will fail if the code contains features that cannot be safely transpiled by esbuild. See [esbuild docs](https://esbuild.github.io/content-types/#javascript) for more details.

## build.polyfillModulePreload

- **Type:** `boolean`
- **Default:** `true`

Whether to automatically inject [module preload polyfill](https://guybedford.com/es-module-preloading-integrity#modulepreload-polyfill).

If set to `true`, the polyfill is auto injected into the proxy module of each `index.html` entry. If the build is configured to use a non-html custom entry via `build.rollupOptions.input`, then it is necessary to manually import the polyfill in your custom entry:

```js
import 'vite/modulepreload-polyfill'
```

Note: the polyfill does **not** apply to [Library Mode](/guide/build#library-mode). If you need to support browsers without native dynamic import, you should probably avoid using it in your library.

## build.outDir

- **Type:** `string`
- **Default:** `dist`

Specify the output directory (relative to [project root](/guide/#index-html-and-project-root)).

## build.assetsDir

- **Type:** `string`
- **Default:** `assets`

Specify the directory to nest generated assets under (relative to `build.outDir`).

## build.assetsInlineLimit

- **Type:** `number`
- **Default:** `4096` (4kb)

Imported or referenced assets that are smaller than this threshold will be inlined as base64 URLs to avoid extra http requests. Set to `0` to disable inlining altogether.

::: tip Note
If you specify `build.lib`, `build.assetsInlineLimit` will be ignored and assets will always be inlined, regardless of file size.
:::

## build.cssCodeSplit

- **Type:** `boolean`
- **Default:** `true`

Enable/disable CSS code splitting. When enabled, CSS imported in async chunks will be inlined into the async chunk itself and inserted when the chunk is loaded.

If disabled, all CSS in the entire project will be extracted into a single CSS file.

::: tip Note
If you specify `build.lib`, `build.cssCodeSplit` will be `false` as default.
:::

## build.cssTarget

- **Type:** `string | string[]`
- **Default:** the same as [`build.target`](#build-target)

This options allows users to set a different browser target for CSS minification from the one used for JavaScript transpilation.

It should only be used when you are targeting a non-mainstream browser.
One example is Android WeChat WebView, which supports most modern JavaScript features but not the [`#RGBA` hexadecimal color notation in CSS](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#rgb_colors).
In this case, you need to set `build.cssTarget` to `chrome61` to prevent vite from transform `rgba()` colors into `#RGBA` hexadecimal notations.

## build.sourcemap

- **Type:** `boolean | 'inline' | 'hidden'`
- **Default:** `false`

Generate production source maps. If `true`, a separate sourcemap file will be created. If `'inline'`, the sourcemap will be appended to the resulting output file as a data URI. `'hidden'` works like `true` except that the corresponding sourcemap comments in the bundled files are suppressed.

## build.rollupOptions

- **Type:** [`RollupOptions`](https://rollupjs.org/guide/en/#big-list-of-options)

Directly customize the underlying Rollup bundle. This is the same as options that can be exported from a Rollup config file and will be merged with Vite's internal Rollup options. See [Rollup options docs](https://rollupjs.org/guide/en/#big-list-of-options) for more details.

## build.commonjsOptions

- **Type:** [`RollupCommonJSOptions`](https://github.com/rollup/plugins/tree/master/packages/commonjs#options)

Options to pass on to [@rollup/plugin-commonjs](https://github.com/rollup/plugins/tree/master/packages/commonjs).

## build.dynamicImportVarsOptions

- **Type:** [`RollupDynamicImportVarsOptions`](https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#options)
- **Related:** [Dynamic Import](/guide/features#dynamic-import)

Options to pass on to [@rollup/plugin-dynamic-import-vars](https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars).

## build.lib

- **Type:** `{ entry: string, name?: string, formats?: ('es' | 'cjs' | 'umd' | 'iife')[], fileName?: string | ((format: ModuleFormat) => string) }`
- **Related:** [Library Mode](/guide/build#library-mode)

Build as a library. `entry` is required since the library cannot use HTML as entry. `name` is the exposed global variable and is required when `formats` includes `'umd'` or `'iife'`. Default `formats` are `['es', 'umd']`. `fileName` is the name of the package file output, default `fileName` is the name option of package.json, it can also be defined as function taking the `format` as an argument.

## build.manifest

- **Type:** `boolean | string`
- **Default:** `false`
- **Related:** [Backend Integration](/guide/backend-integration)

When set to `true`, the build will also generate a `manifest.json` file that contains a mapping of non-hashed asset filenames to their hashed versions, which can then be used by a server framework to render the correct asset links. When the value is a string, it will be used as the manifest file name.

## build.ssrManifest

- **Type:** `boolean | string`
- **Default:** `false`
- **Related:** [Server-Side Rendering](/guide/ssr)

When set to `true`, the build will also generate a SSR manifest for determining style links and asset preload directives in production. When the value is a string, it will be used as the manifest file name.

## build.ssr

- **Type:** `boolean | string`
- **Default:** `undefined`
- **Related:** [Server-Side Rendering](/guide/ssr)

Produce SSR-oriented build. The value can be a string to directly specify the SSR entry, or `true`, which requires specifying the SSR entry via `rollupOptions.input`.

## build.minify

- **Type:** `boolean | 'terser' | 'esbuild'`
- **Default:** `'esbuild'`

Set to `false` to disable minification, or specify the minifier to use. The default is [esbuild](https://github.com/evanw/esbuild) which is 20 ~ 40x faster than terser and only 1 ~ 2% worse compression. [Benchmarks](https://github.com/privatenumber/minification-benchmarks)

Note the `build.minify` option does not minify whitespaces when using the `'es'` format in lib mode, as it removes pure annotations and break tree-shaking.

Terser must be installed when it is set to `'terser'`.

```sh
npm add -D terser
```

## build.terserOptions

- **Type:** `TerserOptions`

Additional [minify options](https://terser.org/docs/api-reference#minify-options) to pass on to Terser.

## build.write

- **Type:** `boolean`
- **Default:** `true`

Set to `false` to disable writing the bundle to disk. This is mostly used in [programmatic `build()` calls](/guide/api-javascript#build) where further post processing of the bundle is needed before writing to disk.

## build.emptyOutDir

- **Type:** `boolean`
- **Default:** `true` if `outDir` is inside `root`

By default, Vite will empty the `outDir` on build if it is inside project root. It will emit a warning if `outDir` is outside of root to avoid accidentally removing important files. You can explicitly set this option to suppress the warning. This is also available via command line as `--emptyOutDir`.

## build.reportCompressedSize

- **Type:** `boolean`
- **Default:** `true`

Enable/disable gzip-compressed size reporting. Compressing large output files can be slow, so disabling this may increase build performance for large projects.

## build.chunkSizeWarningLimit

- **Type:** `number`
- **Default:** `500`

Limit for chunk size warnings (in kbs).

## build.watch

- **Type:** [`WatcherOptions`](https://rollupjs.org/guide/en/#watch-options)`| null`
- **Default:** `null`

Set to `{}` to enable rollup watcher. This is mostly used in cases that involve build-only plugins or integrations processes.

::: warning Using Vite on Windows Subsystem for Linux (WSL) 2

There are cases that file system watching does not work with WSL2.
See [`server.watch`](./server-options.md#server-watch) for more details.

:::
