# Migration from v7

If you are migrating from `rolldown-vite`, the technical preview release for Rolldown integrated Vite for v6 & v7, only the sections with <Badge text="NRV" type="warning" /> in the title are applicable.

## Default Browser Target change [<Badge text="NRV" type="warning" />](#migration-from-v7)

The default browser value of `build.target` and `'baseline-widely-available'`, is updated to newer browser version:

- Chrome 107 → 111
- Edge 107 → 111
- Firefox 104 → 114
- Safari 16.0 → 16.4

These browser versions align with [Baseline Widely Available](https://web-platform-dx.github.io/web-features/) feature sets as of 2026-01-01. In other words, they were all released about two and a half years ago.

## Rolldown

Vite 8 uses Rolldown and Oxc based tools instead of esbuild and Rollup.

### Gradual Migration

The `rolldown-vite` package implements Vite 7 with Rolldown, without other Vite 8 changes. This can be used as a intermediate step to migrate to Vite 8. See [the Rolldown Integration guide](https://v7.vite.dev/guide/rolldown) in the Vite 7 docs to switch to `rolldown-vite` from Vite 7.

For users migrating from `rolldown-vite` to Vite 8, you can undo the dependency changes in `package.json` and update to Vite 8:

```json
{
  "devDependencies": {
    "vite": "npm:rolldown-vite@7.2.2" // [!code --]
    "vite": "^8.0.0" // [!code ++]
  }
}
```

### Dependency Optimizer now uses Rolldown

Rolldown is now used for dependency optimization instead of esbuild. Vite still supports [`optimizeDeps.esbuildOptions`](/config/dep-optimization-options#optimizedeps-esbuildoptions) for backward compatibility by converting it to [`optimizeDeps.rolldownOptions`](/config/dep-optimization-options#optimizedeps-rolldownoptions) automatically. `optimizeDeps.esbuildOptions` is now deprecated and will be removed in the future and we encourage you to migrate to `optimizeDeps.rolldownOptions`.

The following options are converted automatically:

- [`esbuildOptions.minify`](https://esbuild.github.io/api/#minify) -> `rolldownOptions.output.minify`
- [`esbuildOptions.treeShaking`](https://esbuild.github.io/api/#tree-shaking) -> `rolldownOptions.treeshake`
- [`esbuildOptions.define`](https://esbuild.github.io/api/#define) -> `rolldownOptions.transform.define`
- [`esbuildOptions.loader`](https://esbuild.github.io/api/#loader) -> `rolldownOptions.moduleTypes`
- [`esbuildOptions.preserveSymlinks`](https://esbuild.github.io/api/#preserve-symlinks) -> `!rolldownOptions.resolve.symlinks`
- [`esbuildOptions.resolveExtensions`](https://esbuild.github.io/api/#resolve-extensions) -> `rolldownOptions.resolve.extensions`
- [`esbuildOptions.mainFields`](https://esbuild.github.io/api/#main-fields) -> `rolldownOptions.resolve.mainFields`
- [`esbuildOptions.conditions`](https://esbuild.github.io/api/#conditions) -> `rolldownOptions.resolve.conditionNames`
- [`esbuildOptions.keepNames`](https://esbuild.github.io/api/#keep-names) -> `rolldownOptions.output.keepNames`
- [`esbuildOptions.platform`](https://esbuild.github.io/api/#platform) -> `rolldownOptions.platform`
- [`esbuildOptions.plugins`](https://esbuild.github.io/plugins/) -> `rolldownOptions.plugins` (partial support)

<!-- TODO: add link to rolldownOptions.* -->

You can get the options set by the compatibility layer from the `configResolved` hook:

```js
const plugin = {
  name: 'log-config',
  configResolved(config) {
    console.log('options', config.optimizeDeps.rolldownOptions)
  },
},
```

### JavaScript Transforms by Oxc

Oxc is now used for JavaScript transformation instead of esbuild. Vite still supports the [`esbuild`](/config/shared-options#esbuild) option for backward compatibility by converting it to [`oxc`](/config/shared-options#oxc) automatically. `esbuild` is now deprecated and will be removed in the future and we encourage you to migrate to `oxc`.

The following options are converted automatically:

- `esbuild.jsxInject` -> `oxc.jsxInject`
- `esbuild.include` -> `oxc.include`
- `esbuild.exclude` -> `oxc.exclude`
- [`esbuild.jsx`](https://esbuild.github.io/api/#jsx) -> [`oxc.jsx`](https://oxc.rs/docs/guide/usage/transformer/jsx)
  - `esbuild.jsx: 'preserve'` -> `oxc.jsx: 'preserve'`
  - `esbuild.jsx: 'automatic'` -> `oxc.jsx: { runtime: 'automatic' }`
    - [`esbuild.jsxImportSource`](https://esbuild.github.io/api/#jsx-import-source) -> `oxc.jsx.importSource`
  - `esbuild.jsx: 'transform'` -> `oxc.jsx: { runtime: 'classic' }`
    - [`esbuild.jsxFactory`](https://esbuild.github.io/api/#jsx-factory) -> `oxc.jsx.pragma`
    - [`esbuild.jsxFragment`](https://esbuild.github.io/api/#jsx-fragment) -> `oxc.jsx.pragmaFrag`
  - [`esbuild.jsxDev`](https://esbuild.github.io/api/#jsx-dev) -> `oxc.jsx.development`
  - [`esbuild.jsxSideEffects`](https://esbuild.github.io/api/#jsx-side-effects) -> `oxc.jsx.pure`
- [`esbuild.define`](https://esbuild.github.io/api/#define) -> [`oxc.define`](https://oxc.rs/docs/guide/usage/transformer/global-variable-replacement#define)
- [`esbuild.banner`](https://esbuild.github.io/api/#banner) -> custom plugin using transform hook
- [`esbuild.footer`](https://esbuild.github.io/api/#footer) -> custom plugin using transform hook

The [`esbuild.supported`](https://esbuild.github.io/api/#supported) option is not supported by Oxc. If you need this option, please see [oxc-project/oxc#15373](https://github.com/oxc-project/oxc/issues/15373).

You can get the options set by the compatibility layer from the `configResolved` hook:

```js
const plugin = {
  name: 'log-config',
  configResolved(config) {
    console.log('options', config.oxc)
  },
},
```

<!-- TODO: add link to rolldownOptions.output.minify -->

Currently, the Oxc transformer does not support lowering native decorators as we are waiting for the specification to progress, see ([oxc-project/oxc#9170](https://github.com/oxc-project/oxc/issues/9170)).

:::: details Workaround for lowering native decorators

You can use [Babel](https://babeljs.io/) or [SWC](https://swc.rs/) to lower native decorators for the time being. While SWC is faster than Babel, it does **not support the latest decorator spec** that esbuild supports.

The decorator spec has been updated multiple times since it reached stage 3. The versions supported by each tool are:

- `"2023-11"` (esbuild, TypeScript 5.4+ and Babel support this version)
- `"2023-05"` (TypeScript 5.2+ supports this version)
- `"2023-01"` (TypeScript 5.0+ supports this version)
- `"2022-03"` (SWC supports this version)

See the [Babel decorators versions guide](https://babeljs.io/docs/babel-plugin-proposal-decorators#version) for differences between each version.

**Using Babel:**

::: code-group

```bash [npm]
$ npm install -D @rollup/plugin-babel @babel/plugin-proposal-decorators
```

```bash [Yarn]
$ yarn add -D @rollup/plugin-babel @babel/plugin-proposal-decorators
```

```bash [pnpm]
$ pnpm add -D @rollup/plugin-babel @babel/plugin-proposal-decorators
```

```bash [Bun]
$ bun add -D @rollup/plugin-babel @babel/plugin-proposal-decorators
```

```bash [Deno]
$ deno add -D npm:@rollup/plugin-babel npm:@babel/plugin-proposal-decorators
```

:::

```ts [vite.config.ts]
import { defineConfig, withFilter } from 'vite'
import { babel } from '@rollup/plugin-babel'

export default defineConfig({
  plugins: [
    withFilter(
      babel({
        configFile: false,
        plugins: [
          ['@babel/plugin-proposal-decorators', { version: '2023-11' }],
        ],
      }),
      // Only run this transform if the file contains a decorator.
      { transform: { code: '@' } },
    ),
  ],
})
```

**Using SWC:**

::: code-group

```bash [npm]
$ npm install -D @rollup/plugin-swc @swc/core
```

```bash [Yarn]
$ yarn add -D @rollup/plugin-swc @swc/core
```

```bash [pnpm]
$ pnpm add -D @rollup/plugin-swc @swc/core
```

```bash [Bun]
$ bun add -D @rollup/plugin-swc @swc/core
```

```bash [Deno]
$ deno add -D npm:@rollup/plugin-swc npm:@swc/core
```

:::

```js
import { defineConfig, withFilter } from 'vite'

export default defineConfig({
  // ...
  plugins: [
    withFilter(
      swc({
        swc: {
          jsc: {
            parser: { decorators: true, decoratorsBeforeExport: true },
            // NOTE: SWC doesn't support the '2023-11' version yet.
            transform: { decoratorVersion: '2022-03' },
          },
        },
      }),
      // Only run this transform if the file contains a decorator.
      { transform: { code: '@' } },
    ),
  ],
})
```

::::

#### esbuild Fallbacks

`esbuild` is no longer directly used by Vite and is now an optional dependency. If you are using a plugin that uses the `transformWithEsbuild` function, you need to install `esbuild` as a `devDependency`. The `transformWithEsbuild` function is deprecated and will be removed in the future. We recommend migrating to the new `transformWithOxc` function instead.

### JavaScript Minification by Oxc

The Oxc Minifier is now used for JavaScript minification instead of esbuild. You can use the deprecated [`build.minify: 'esbuild'`](/config/build-options#build-minify) option to switch back to esbuild. This configuration option will be removed in the future and you need install `esbuild` as a `devDependency` as Vite no longer relies on esbuild directly.

If you were using the `esbuild.minify*` options to control minification behavior, you can now use `build.rolldownOptions.output.minify` instead. If you were using the `esbuild.drop` option, you can now use [`build.rolldownOptions.output.minify.compress.drop*` options](https://oxc.rs/docs/guide/usage/minifier/dead-code-elimination).

Property mangling and its related options ([`mangleProps`, `reserveProps`, `mangleQuoted`, `mangleCache`](https://esbuild.github.io/api/#mangle-props)) are not supported by Oxc. If you need these options, please see [oxc-project/oxc#15375](https://github.com/oxc-project/oxc/issues/15375).

esbuild and Oxc Minifier make slightly different assumptions about source code. In case you suspect the minifier is causing breakage in your code, you can compare these assumptions here:

- [esbuild minify assumptions](https://esbuild.github.io/api/#minify-considerations)
- [Oxc Minifier assumptions](https://oxc.rs/docs/guide/usage/minifier.html#assumptions)

Please report any issues you find related to minification in your JavaScript apps.

### CSS Minification by Lightning CSS

[Lightning CSS](https://lightningcss.dev/) is now used for CSS minification by default. You can use the [`build.cssMinify: 'esbuild'`](/config/build-options#build-cssminify) option to switch back to esbuild. Note that you need to install `esbuild` as a `devDependency`.

Lightning CSS supports better syntax lowering and your CSS bundle size might increase slightly.

### Consistent CommonJS Interop

The `default` import from a CommonJS (CJS) module is now handled in a consistent way.

If it matches one of the following conditions, the `default` import is the `module.exports` value of the importee CJS module. Otherwise, the `default` import is the `module.exports.default` value of the importee CJS module:

- The importer is `.mjs` or `.mts`.
- The closest `package.json` for the importer has a `type` field set to `module`.
- The `module.exports.__esModule` value of the importee CJS module is not set to true.

::: details The previous behavior

In development, if it matches one of the following conditions, the `default` import is the `module.exports` value of the importee CJS module. Otherwise, the `default` import is the `module.exports.default` value of the importee CJS module:

- _The importer is included in the dependency optimization_ and `.mjs` or `.mts`.
- _The importer is included in the dependency optimization_ and the closest `package.json` for the importer has a `type` field set to `module`.
- The `module.exports.__esModule` value of the importee CJS module is not set to true.

In build, the conditions were:

- The `module.exports.__esModule` value of the importee CJS module is not set to true.
- _`default` property of `module.exports` does not exist_.

(assuming [`build.commonjsOptions.defaultIsModuleExports`](https://github.com/rollup/plugins/tree/master/packages/commonjs#defaultismoduleexports) is not changed from the default `'auto'`)

:::

See Rolldown's docs about this problem for more details: [Ambiguous `default` import from CJS modules - Bundling CJS | Rolldown](https://rolldown.rs/in-depth/bundling-cjs#ambiguous-default-import-from-cjs-modules).

This change may break some existing code importing CJS modules. You can use the deprecated `legacy.inconsistentCjsInterop: true` option to temporarily restore the previous behavior. If you find a package that is affected by this change, please report it to the package author or send them a pull request. Make sure to link to the Rolldown document above so that the author can understand the context.

### Removed Module Resolution Using Format Sniffing

When both `browser` and `module` fields are present in `package.json`, Vite used to resolve the field based on the content of the file and it used to pick the ESM file for browsers. This was introduced because some packages were using the `module` field to point to ESM files for Node.js and some other packages were using the `browser` field to point to UMD files for browsers. Given that the modern `exports` field solved this problem and is now adopted by many packages, Vite no longer uses this heuristic and always respects the order of the [`resolve.mainFields`](/config/shared-options#resolve-mainfields) option. If you were relying on this behavior, you can use the [`resolve.alias`](/config/shared-options#resolve-alias) option to map the field to the desired file or apply a patch with your package manager (e.g. `patch-package`, `pnpm patch`).

### Require Calls For Externalized Modules

`require` calls for externalized modules are now preserved as `require` calls and not converted to `import` statements. This is to preserve the semantics of `require` calls. If you want to convert them to `import` statements, you can use Rolldown's built-in `esmExternalRequirePlugin`, which is re-exported from `vite`.

```js
import { defineConfig, esmExternalRequirePlugin } from 'vite'

export default defineConfig({
  // ...
  plugins: [
    esmExternalRequirePlugin({
      external: ['react', 'vue', /^node:/],
    }),
  ],
})
```

See Rolldown's docs for more details: [`require` external modules - Bundling CJS | Rolldown](https://rolldown.rs/in-depth/bundling-cjs#require-external-modules).

### `import.meta.url` in UMD / IIFE

`import.meta.url` is no longer polyfilled in UMD / IIFE output formats. It will be replaced with `undefined` by default. If you prefer the previous behavior, you can use the `define` option with `build.rolldownOptions.output.intro` option. See Rolldown's docs for more details: [Well-known `import.meta` properties - Non ESM Output Formats | Rolldown](https://rolldown.rs/in-depth/non-esm-output-formats#well-known-import-meta-properties).

### Removed `build.rollupOptions.watch.chokidar` option

The `build.rollupOptions.watch.chokidar` option was removed. Please migrate to the `build.rolldownOptions.watch.notify` option.

<!-- TODO: add link to rolldownOptions.watch.notify -->

### Deprecate `build.rollupOptions.output.manualChunks`

The `output.manualChunks` option is deprecated. Rolldown has the more flexible `advancedChunks` option. See Rolldown's docs for more details about `advancedChunks`: [Advanced Chunks - Rolldown](https://rolldown.rs/in-depth/advanced-chunks).

<!-- TODO: add link to rolldownOptions.output.advancedChunks -->

### Module Type Support and Auto Detection

_This change only affects plugin authors._

Rolldown has experimental support for [Module types](https://rolldown.rs/guide/notable-features#module-types), similar to [esbuild's `loader` option](https://esbuild.github.io/api/#loader). Due to this, Rolldown automatically sets a module type based on the extension of the resolved id. If you are converting content from other module types to JavaScript in `load` or `transform` hooks, you may need to add `moduleType: 'js'` to the returned value:

```js
const plugin = {
  name: 'txt-loader',
  load(id) {
    if (id.endsWith('.txt')) {
      const content = fs.readFile(id, 'utf-8')
      return {
        code: `export default ${JSON.stringify(content)}`,
        moduleType: 'js', // [!code ++]
      }
    }
  },
}
```

### Other Related Deprecations

The following options are deprecated and will be removed in the future:

- `build.rollupOptions`: renamed to `build.rolldownOptions`
- `worker.rollupOptions`: renamed to `worker.rolldownOptions`
- `build.commonjsOptions`: it is now no-op

## General Changes [<Badge text="NRV" type="warning" />](#migration-from-v7)

## Removed deprecated features [<Badge text="NRV" type="warning" />](#migration-from-v7)

**_TODO: This change is not implemented yet, but will be implemented before stable release._**

## Advanced

These breaking changes are expected to only affect a minority of use cases:

- **[TODO: this will be fixed before stable release]** https://github.com/rolldown/rolldown/issues/5726 (affects nuxt, qwik)
- **[TODO: this will be fixed before stable release]** https://github.com/rolldown/rolldown/issues/3403 (affects sveltekit)
- **[TODO: this will be fixed before stable release]** Legacy chunks are emitted as an asset file instead of a chunk file due to the lack of prebuilt chunk emit feature ([rolldown#4304](https://github.com/rolldown/rolldown/issues/4034)). This means the chunk related options does not apply to legacy chunks and the manifest file will not include legacy chunks as a chunk file.
- **[TODO: this will be fixed before stable release]** resolver cache breaks minor cases in Vitest ([rolldown-vite#466](https://github.com/vitejs/rolldown-vite/issues/466), [vitest#8754](https://github.com/vitest-dev/vitest/issues/8754#issuecomment-3441115032))
- **[TODO: this will be fixed before stable release]** The resolver does not work with yarn pnp ([rolldown-vite#324](https://github.com/vitejs/rolldown-vite/issues/324), [rolldown-vite#392](https://github.com/vitejs/rolldown-vite/issues/392))
- **[TODO: this will be fixed before stable release]** native plugin ordering issue ([rolldown-vite#373](https://github.com/vitejs/rolldown-vite/issues/373))
- **[TODO: this will be fixed before stable release]** `@vite-ignore` comment edge case ([rolldown-vite#426](https://github.com/vitejs/rolldown-vite/issues/426))
- **[TODO: this will be fixed before stable release]** https://github.com/rolldown/rolldown/issues/3403
- [Extglobs](https://github.com/micromatch/picomatch/blob/master/README.md#extglobs) are not supported yet ([rolldown-vite#365](https://github.com/vitejs/rolldown-vite/issues/365))
- `define` does not share reference for objects: When you pass an object as a value to `define`, each variable will have a separate copy of the object. See [Oxc Transformer document](https://oxc.rs/docs/guide/usage/transformer/global-variable-replacement#define) for more details.
- `bundle` object changes (`bundle` is an object passed in `generateBundle` / `writeBundle` hooks, returned by `build` function):
  - Assigning to `bundle[foo]` is not supported. This is discouraged by Rollup as well. Please use `this.emitFile()` instead.
  - the reference is not shared across the hooks ([rolldown-vite#410](https://github.com/vitejs/rolldown-vite/issues/410))
  - `structuredClone(bundle)` errors with `DataCloneError: #<Object> could not be cloned`. This is not supported anymore. Please clone it with `structuredClone({ ...bundle })`. ([rolldown-vite#128](https://github.com/vitejs/rolldown-vite/issues/128))
- All parallel hooks in Rollup works as sequential hooks. See [Rolldown's documentation](https://rolldown.rs/apis/plugin-api#sequential-hook-execution) for more details.
- `"use strict";` is not injected sometimes. See [Rolldown's documentation](https://rolldown.rs/in-depth/directives) for more details.
- Transforming to lower than ES5 with plugin-legacy is not supported ([rolldown-vite#452](https://github.com/vitejs/rolldown-vite/issues/452))
- Passing the same browser with multiple versions of it to `build.target` option now errors: esbuild selects the latest version of it, which was probably not what you intended.
- Missing support by Rolldown: The following features are not supported by Rolldown and is no longer supported by Vite.
  - `build.rollupOptions.output.format: 'system'` ([rolldown#2387](https://github.com/rolldown/rolldown/issues/2387))
  - `build.rollupOptions.output.format: 'amd'` ([rolldown#2387](https://github.com/rolldown/rolldown/issues/2528))
  - Complete support for TypeScript legacy namespace ([oxc-project/oxc#14227](https://github.com/oxc-project/oxc/issues/14227))
  - `shouldTransformCachedModule` hook ([rolldown#4389](https://github.com/rolldown/rolldown/issues/4389))
  - `resolveImportMeta` hook ([rolldown#1010](https://github.com/rolldown/rolldown/issues/1010))
  - `renderDynamicImport` hook ([rolldown#4532](https://github.com/rolldown/rolldown/issues/4532))
  - `resolveFileUrl` hook
- `parseAst` / `parseAstAsync` functions are now deprecated in favor of `parse` / `parseAsync` functions which has more features.

## Migration from v6

Check the [Migration from v6 Guide](https://v7.vite.dev/guide/migration) in the Vite v7 docs first to see the needed changes to port your app to Vite 7, and then proceed with the changes on this page.
