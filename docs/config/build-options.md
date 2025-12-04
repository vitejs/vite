# Build Options

Unless noted, the options in this section are only applied to build.

## build.target

- **Type:** `string | string[]`
- **Default:** `'baseline-widely-available'`
- **Related:** [Browser Compatibility](/guide/build#browser-compatibility)

Browser compatibility target for the final bundle. The default value is a Vite special value, `'baseline-widely-available'`, which targets browsers that are included in the [Baseline](https://web-platform-dx.github.io/web-features/) Widely Available on 2026-01-01. Specifically, it is `['chrome111', 'edge111', 'firefox114', 'safari16.4']`.

Another special value is `'esnext'` - which assumes native dynamic imports support and will only perform minimal transpiling.

The transform is performed with Oxc Transformer and the value should be a valid [Oxc Transformer target option](https://oxc.rs/docs/guide/usage/transformer/lowering#target). Custom targets can either be an ES version (e.g. `es2015`), a browser with version (e.g. `chrome58`), or an array of multiple target strings.

Note the build will output a warning if the code contains features that cannot be safely transpiled by Oxc. See [Oxc docs](https://oxc.rs/docs/guide/usage/transformer/lowering#warnings) for more details.

## build.modulePreload

- **Type:** `boolean | { polyfill?: boolean, resolveDependencies?: ResolveModulePreloadDependenciesFn }`
- **Default:** `{ polyfill: true }`

By default, a [module preload polyfill](https://guybedford.com/es-module-preloading-integrity#modulepreload-polyfill) is automatically injected. The polyfill is auto injected into the proxy module of each `index.html` entry. If the build is configured to use a non-HTML custom entry via `build.rollupOptions.input`, then it is necessary to manually import the polyfill in your custom entry:

```js
import 'vite/modulepreload-polyfill'
```

Note: the polyfill does **not** apply to [Library Mode](/guide/build#library-mode). If you need to support browsers without native dynamic import, you should probably avoid using it in your library.

The polyfill can be disabled using `{ polyfill: false }`.

The list of chunks to preload for each dynamic import is computed by Vite. By default, an absolute path including the `base` will be used when loading these dependencies. If the `base` is relative (`''` or `'./'`), `import.meta.url` is used at runtime to avoid absolute paths that depend on the final deployed base.

There is experimental support for fine grained control over the dependencies list and their paths using the `resolveDependencies` function. [Give Feedback](https://github.com/vitejs/vite/discussions/13841). It expects a function of type `ResolveModulePreloadDependenciesFn`:

```ts
type ResolveModulePreloadDependenciesFn = (
  url: string,
  deps: string[],
  context: {
    hostId: string
    hostType: 'html' | 'js'
  },
) => string[]
```

The `resolveDependencies` function will be called for each dynamic import with a list of the chunks it depends on, and it will also be called for each chunk imported in entry HTML files. A new dependencies array can be returned with these filtered or more dependencies injected, and their paths modified. The `deps` paths are relative to the `build.outDir`. The return value should be a relative path to the `build.outDir`.

```js twoslash
/** @type {import('vite').UserConfig} */
const config = {
  // prettier-ignore
  build: {
// ---cut-before---
modulePreload: {
  resolveDependencies: (filename, deps, { hostId, hostType }) => {
    return deps.filter(condition)
  },
},
// ---cut-after---
  },
}
```

The resolved dependency paths can be further modified using [`experimental.renderBuiltUrl`](../guide/build.md#advanced-base-options).

## build.polyfillModulePreload

- **Type:** `boolean`
- **Default:** `true`
- **Deprecated** use `build.modulePreload.polyfill` instead

Whether to automatically inject a [module preload polyfill](https://guybedford.com/es-module-preloading-integrity#modulepreload-polyfill).

## build.outDir

- **Type:** `string`
- **Default:** `dist`

Specify the output directory (relative to [project root](/guide/#index-html-and-project-root)).

## build.assetsDir

- **Type:** `string`
- **Default:** `assets`

Specify the directory to nest generated assets under (relative to `build.outDir`. This is not used in [Library Mode](/guide/build#library-mode)).

## build.assetsInlineLimit

- **Type:** `number` | `((filePath: string, content: Buffer) => boolean | undefined)`
- **Default:** `4096` (4 KiB)

Imported or referenced assets that are smaller than this threshold will be inlined as base64 URLs to avoid extra http requests. Set to `0` to disable inlining altogether.

If a callback is passed, a boolean can be returned to opt-in or opt-out. If nothing is returned the default logic applies.

Git LFS placeholders are automatically excluded from inlining because they do not contain the content of the file they represent.

::: tip Note
If you specify `build.lib`, `build.assetsInlineLimit` will be ignored and assets will always be inlined, regardless of file size or being a Git LFS placeholder.
:::

## build.cssCodeSplit

- **Type:** `boolean`
- **Default:** `true`

Enable/disable CSS code splitting. When enabled, CSS imported in async JS chunks will be preserved as chunks and fetched together when the chunk is fetched.

If disabled, all CSS in the entire project will be extracted into a single CSS file.

::: tip Note
If you specify `build.lib`, `build.cssCodeSplit` will be `false` as default.
:::

## build.cssTarget

- **Type:** `string | string[]`
- **Default:** the same as [`build.target`](#build-target)

This option allows users to set a different browser target for CSS minification from the one used for JavaScript transpilation.

It should only be used when you are targeting a non-mainstream browser.
One example is Android WeChat WebView, which supports most modern JavaScript features but not the [`#RGBA` hexadecimal color notation in CSS](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#rgb_colors).
In this case, you need to set `build.cssTarget` to `chrome61` to prevent vite from transforming `rgba()` colors into `#RGBA` hexadecimal notations.

## build.cssMinify

- **Type:** `boolean | 'lightningcss' | 'esbuild'`
- **Default:** the same as [`build.minify`](#build-minify) for client, `'lightningcss'` for SSR

This option allows users to override CSS minification specifically instead of defaulting to `build.minify`, so you can configure minification for JS and CSS separately. Vite uses [Lightning CSS](https://lightningcss.dev/minification.html) by default to minify CSS. It can be configured using [`css.lightningcss`](./shared-options.md#css-lightningcss). Set the option to `'esbuild'` to use esbuild instead.

esbuild must be installed when it is set to `'esbuild'`.

```sh
npm add -D esbuild
```

## build.sourcemap

- **Type:** `boolean | 'inline' | 'hidden'`
- **Default:** `false`

Generate production source maps. If `true`, a separate sourcemap file will be created. If `'inline'`, the sourcemap will be appended to the resulting output file as a data URI. `'hidden'` works like `true` except that the corresponding sourcemap comments in the bundled files are suppressed.

## build.rolldownOptions

- **Type:** [`RolldownOptions`](https://rollupjs.org/configuration-options/)

<!-- TODO: update the link above and below to Rolldown's documentation -->

Directly customize the underlying Rolldown bundle. This is the same as options that can be exported from a Rolldown config file and will be merged with Vite's internal Rolldown options. See [Rolldown options docs](https://rollupjs.org/configuration-options/) for more details.

## build.rollupOptions

- **Type:** `RolldownOptions`
- **Deprecated**

This option is an alias of `build.rolldownOptions` option. Use `build.rolldownOptions` option instead.

## build.dynamicImportVarsOptions

- **Type:** [`RollupDynamicImportVarsOptions`](https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#options)
- **Related:** [Dynamic Import](/guide/features#dynamic-import)

Options to pass on to [@rollup/plugin-dynamic-import-vars](https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars).

<!-- TODO: we need to have a more detailed explanation here as we no longer use @rollup/plugin-dynamic-import-vars. we should say it's compatible with it though -->

## build.lib

- **Type:** `{ entry: string | string[] | { [entryAlias: string]: string }, name?: string, formats?: ('es' | 'cjs' | 'umd' | 'iife')[], fileName?: string | ((format: ModuleFormat, entryName: string) => string), cssFileName?: string }`
- **Related:** [Library Mode](/guide/build#library-mode)

Build as a library. `entry` is required since the library cannot use HTML as entry. `name` is the exposed global variable and is required when `formats` includes `'umd'` or `'iife'`. Default `formats` are `['es', 'umd']`, or `['es', 'cjs']`, if multiple entries are used.

`fileName` is the name of the package file output, which defaults to the `"name"` in `package.json`. It can also be defined as a function taking the `format` and `entryName` as arguments, and returning the file name.

If your package imports CSS, `cssFileName` can be used to specify the name of the CSS file output. It defaults to the same value as `fileName` if it's set a string, otherwise it also falls back to the `"name"` in `package.json`.

```js twoslash [vite.config.js]
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: ['src/main.js'],
      fileName: (format, entryName) => `my-lib-${entryName}.${format}.js`,
      cssFileName: 'my-lib-style',
    },
  },
})
```

## build.license

- **Type:** `boolean | { fileName?: string }`
- **Default:** `false`
- **Related:** [License](/guide/features#license)

When set to `true`, the build will generate a `.vite/license.md` file that includes all bundled dependencies' licenses.

If `fileName` is passed, it will be used as the license file name relative to the `outDir`. If it ends with `.json`, the raw JSON metadata will be generated instead and can be used for further processing. For example:

```json
[
  {
    "name": "dep-1",
    "version": "1.2.3",
    "identifier": "CC0-1.0",
    "text": "CC0 1.0 Universal\n\n..."
  },
  {
    "name": "dep-2",
    "version": "4.5.6",
    "identifier": "MIT",
    "text": "MIT License\n\n..."
  }
]
```

## build.manifest

- **Type:** `boolean | string`
- **Default:** `false`
- **Related:** [Backend Integration](/guide/backend-integration)

Whether to generate a manifest file that contains a mapping of non-hashed asset filenames to their hashed versions, which can then be used by a server framework to render the correct asset links.

When the value is a string, it will be used as the manifest file path relative to `build.outDir`. When set to `true`, the path would be `.vite/manifest.json`.

## build.ssrManifest

- **Type:** `boolean | string`
- **Default:** `false`
- **Related:** [Server-Side Rendering](/guide/ssr)

Whether to generate a SSR manifest file for determining style links and asset preload directives in production.

When the value is a string, it will be used as the manifest file path relative to `build.outDir`. When set to `true`, the path would be `.vite/ssr-manifest.json`.

## build.ssr

- **Type:** `boolean | string`
- **Default:** `false`
- **Related:** [Server-Side Rendering](/guide/ssr)

Produce SSR-oriented build. The value can be a string to directly specify the SSR entry, or `true`, which requires specifying the SSR entry via `rollupOptions.input`.

## build.emitAssets

- **Type:** `boolean`
- **Default:** `false`

During non-client builds, static assets aren't emitted as it is assumed they would be emitted as part of the client build. This option allows frameworks to force emitting them in other environments build. It is responsibility of the framework to merge the assets with a post build step.

## build.ssrEmitAssets

- **Type:** `boolean`
- **Default:** `false`

During the SSR build, static assets aren't emitted as it is assumed they would be emitted as part of the client build. This option allows frameworks to force emitting them in both the client and SSR build. It is responsibility of the framework to merge the assets with a post build step. This option will be replaced by `build.emitAssets` once Environment API is stable.

## build.minify

- **Type:** `boolean | 'oxc' | 'terser' | 'esbuild'`
- **Default:** `'oxc'` for client build, `false` for SSR build

Set to `false` to disable minification, or specify the minifier to use. The default is [Oxc Minifier](https://oxc.rs/docs/guide/usage/minifier) which is 30 ~ 90x faster than terser and only 0.5 ~ 2% worse compression. [Benchmarks](https://github.com/privatenumber/minification-benchmarks)

`build.minify: 'esbuild'` is deprecated and will be removed in the future.

Note the `build.minify` option does not minify whitespaces when using the `'es'` format in lib mode, as it removes pure annotations and breaks tree-shaking.

esbuild or Terser must be installed when it is set to `'esbuild'` or `'terser'` respectively.

```sh
npm add -D esbuild
npm add -D terser
```

## build.terserOptions

- **Type:** `TerserOptions`

Additional [minify options](https://terser.org/docs/api-reference#minify-options) to pass on to Terser.

In addition, you can also pass a `maxWorkers: number` option to specify the max number of workers to spawn. Defaults to the number of CPUs minus 1.

## build.write

- **Type:** `boolean`
- **Default:** `true`

Set to `false` to disable writing the bundle to disk. This is mostly used in [programmatic `build()` calls](/guide/api-javascript#build) where further post processing of the bundle is needed before writing to disk.

## build.emptyOutDir

- **Type:** `boolean`
- **Default:** `true` if `outDir` is inside `root`

By default, Vite will empty the `outDir` on build if it is inside project root. It will emit a warning if `outDir` is outside of root to avoid accidentally removing important files. You can explicitly set this option to suppress the warning. This is also available via command line as `--emptyOutDir`.

## build.copyPublicDir

- **Type:** `boolean`
- **Default:** `true`

By default, Vite will copy files from the `publicDir` into the `outDir` on build. Set to `false` to disable this.

## build.reportCompressedSize

- **Type:** `boolean`
- **Default:** `true`

Enable/disable gzip-compressed size reporting. Compressing large output files can be slow, so disabling this may increase build performance for large projects.

## build.chunkSizeWarningLimit

- **Type:** `number`
- **Default:** `500`

Limit for chunk size warnings (in kB). It is compared against the uncompressed chunk size as the [JavaScript size itself is related to the execution time](https://v8.dev/blog/cost-of-javascript-2019).

## build.watch

<!-- TODO: update the link below to Rolldown's documentation -->

- **Type:** [`WatcherOptions`](https://rollupjs.org/configuration-options/#watch)`| null`
- **Default:** `null`

Set to `{}` to enable rollup watcher. This is mostly used in cases that involve build-only plugins or integrations processes.

::: warning Using Vite on Windows Subsystem for Linux (WSL) 2

There are cases that file system watching does not work with WSL2.
See [`server.watch`](./server-options.md#server-watch) for more details.

:::
