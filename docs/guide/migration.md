# Migration from v7

## New Features

::: tip Temporary section

This section will be moved to the release post before the stable release.

:::

### Built-in tsconfig `paths` Support

Vite 8 now has built-in tsconfig `paths` support, thanks to [Oxc Resolver](https://oxc.rs/docs/guide/usage/resolver). This is not enabled by default, because it has a performance cost and is [discouraged by the TypeScript team to use this option to change the behavior of the external tools](https://www.typescriptlang.org/tsconfig/#paths:~:text=Note%20that%20this%20feature%20does%20not%20change%20how%20import%20paths%20are%20emitted%20by%20tsc%2C%20so%20paths%20should%20only%20be%20used%20to%20inform%20TypeScript%20that%20another%20tool%20has%20this%20mapping%20and%20will%20use%20it%20at%20runtime%20or%20when%20bundling.). While having that caveat, you can enable it by setting `resolve.tsconfigPaths` to `true`.

The tsconfig.json in the closest parent directory will be used. For more details about what tsconfig.json is used, see [the Features page](/guide/features#typescript-compiler-options).

### `emitDecoratorMetadata` Support

Vite 8 now has built-in support for TypeScript's [`emitDecoratorMetadata` option](https://www.typescriptlang.org/tsconfig/#emitDecoratorMetadata), thanks to [Oxc Transformer](https://oxc.rs/docs/guide/usage/transformer). If you have `emitDecoratorMetadata` set to `true` in your tsconfig, this feature will be enabled automatically.

Note that this transformation has some limitations as the full support requires the full type inference by TypeScript compiler, which is not supported. See [Oxc Transformer's documentation](https://oxc.rs/docs/guide/usage/transformer/typescript#decorators) for more details.

## Default Browser Target change

**_TODO: This change is not implemented yet, but will be implemented before stable release._**

The default browser value of `build.target`, `'baseline-widely-available'`, is updated to a newer browser.

- Chrome 107 → 111
- Edge 107 → 111
- Firefox 104 → 114
- Safari 16.0 → 16.4

These browser versions align with [Baseline](https://web-platform-dx.github.io/web-features/) Widely Available feature sets as of 2026-01-01. In other words, they were all released before 2026-01-01.

## Rolldown Integration

Vite 8 uses Oxc based tools instead of esbuild and Rollup.

### Gradual migration

`rolldown-vite` package implements Vite 7 with Rolldown integration, but without the other Vite 8 changes. This can be used as a intermediate step to migrate to Vite 8. See [the Rolldown Integration guide](https://v7.vite.dev/guide/rolldown) in the Vite 7 docs to switch to `rolldown-vite` from Vite 7.

For users migrating from `rolldown-vite` to Vite 8, you can undo the dependencies changes in `package.json` and update to Vite 8.

```json
{
  "dependencies": {
    "vite": "npm:rolldown-vite@7.2.2" // [!code --]
    "vite": "^8.0.0" // [!code ++]
  }
}
```

### Dependency Optimizer now uses Rolldown

Rolldown is now used for dependency optimization instead of esbuild. Vite still supports the [`optimizeDeps.esbuildOptions`](/config/dep-optimization-options#optimizedeps-esbuildoptions) option for backward compatibility by converting it to [`optimizeDeps.rolldownOptions`](/config/dep-optimization-options#optimizedeps-rolldownoptions) internally. But `optimizeDeps.esbuildOptions` is deprecated and will be removed in the future and we encourage you to migrate to `optimizeDeps.rolldownOptions`.

The following options are converted:

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

You can also get the options set by the compatibility layer from the `configResolved` hook:

```js
const plugin = {
  name: 'log-config',
  configResolved(config) {
    console.log('options', config.optimizeDeps.esbuildOptions)
  },
},
```

### JS Transformation by Oxc

Oxc is now used for JS transformation instead of esbuild. Vite still supports the [`esbuild`](/config/shared-options#esbuild) option for backward compatibility by converting it to [`oxc`](/config/shared-options#oxc) internally. But `esbuild` is deprecated and will be removed in the future and we encourage you to migrate to `oxc`.

The following options are converted:

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

[`esbuild.supported`](https://esbuild.github.io/api/#supported) option is not supported by Oxc. If you need these options, please check [oxc-project/oxc#15373](https://github.com/oxc-project/oxc/issues/15373).

You can also get the options set by the compatibility layer from the `configResolved` hook:

```js
const plugin = {
  name: 'log-config',
  configResolved(config) {
    console.log('options', config.oxc)
  },
},
```

<!-- TODO: add link to rolldownOptions.output.minify -->

Currently, Oxc transformer does not support lowering native decorators ([oxc-project/oxc#9170](https://github.com/oxc-project/oxc/issues/9170)).

:::: details Workaround for lowering native decorators

You can use [Babel](https://babeljs.io/) or [SWC](https://swc.rs/) to lower native decorators for the time being. While SWC is faster than Babel, it does **not support the latest decorator spec** that esbuild supports.

The decorator spec has been updated multiple times since it reached stage 3 and the versions supported by each tools are (the version names are same with [babel's options](https://babeljs.io/docs/babel-plugin-proposal-decorators#version)):

- `"2023-11"` (esbuild and TS5.4+ and babel supports this version)
- `"2023-05"` (TS5.2+ supports this version)
- `"2023-01"` (TS5.0+ supports this version)
- `"2022-03"` (SWC supports this version)

**If you want to use babel:**

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
      // only run this transform if the file contains a decorator
      { transform: { code: '@' } },
    ),
  ],
})
```

**If you want to use SWC:**

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
            // NOTE: SWC doesn't support '2023-11' version yet
            transform: { decoratorVersion: '2022-03' },
          },
        },
      }),
      // only run this transform if the file contains a decorator
      { transform: { code: '@' } },
    ),
  ],
})
```

::::

Note that if you use a plugin that uses `transformWithEsbuild` function, you need to install `esbuild` as a dev dependency as it's now an optional dependency. `transformWithEsbuild` function is now deprecated and will be removed in the future. We recommend to use the new `transformWithOxc` function instead.

### JS Minification by Oxc

Oxc Minifier is now used for JS minification by default instead of esbuild. You can use [`build.minify: 'esbuild'`](/config/build-options#minify) option to switch back to esbuild, but this is deprecated and will be removed in the future. Note that you need to install `esbuild` as a dev dependency as it's now an optional dependency.

If you were using `esbuild.minify*` options to control the minification behavior, you can use `build.rolldownOptions.output.minify` option instead. If you were using `esbuild.drop` option, you can use [`build.rolldownOptions.output.minify.compress.drop*` options](https://oxc.rs/docs/guide/usage/minifier/dead-code-elimination) instead.

Property mangling feature is not supported by Oxc and the related options ([`mangleProps`, `reserveProps`, `mangleQuoted`, `mangleCache`](https://esbuild.github.io/api/#mangle-props)) are not supported. If you need these options, please check [oxc-project/oxc#15375](https://github.com/oxc-project/oxc/issues/15375).

Note that esbuild and Oxc Minifier have a slightly different assumptions about the input code. While this would not affect most projects, you can compare the assumptions if the minifier breaks your code ([esbuild assumptions](https://esbuild.github.io/api/#minify-considerations), [Oxc Minifier assumptions](https://oxc.rs/docs/guide/usage/minifier.html#assumptions)).

### CSS Minification by Lightning CSS

[Lightning CSS](https://lightningcss.dev/) is now used for CSS minification by default. You can use [`build.cssMinify: 'esbuild'`](/config/build-options#cssminify) option to switch back to esbuild. Note that you need to install `esbuild` as a dev dependency as it's now an optional dependency.

Lightning CSS supports more syntax lowering, so you may see a bigger CSS bundle size.

### Consistent CJS Interop

The `default` import from a CJS module is now handled in a consistent way.

If it matches one of the following conditions, the `default` import is the `module.exports` value of the importee CJS module. Otherwise, the `default` import is the `module.exports.default` value of the importee CJS module.

- The importer is `.mjs` or `.mts`
- The closest `package.json` for the importer has a `type` field set to `module`
- The `module.exports.__esModule` value of the importee CJS module is not set to true

::: details The previous behaviors

In dev, if it matches one of the following conditions, the `default` import is the `module.exports` value of the importee CJS module. Otherwise, the `default` import is the `module.exports.default` value of the importee CJS module.

- _The importer is included in the dependency optimization_ and `.mjs` or `.mts`
- _The importer is included in the dependency optimization_ and the closest `package.json` for the importer has a `type` field set to `module`
- The `module.exports.__esModule` value of the importee CJS module is not set to true

In build, the conditions were:

- The `module.exports.__esModule` value of the importee CJS module is not set to true
- _`default` property of `module.exports` does not exist_

(assuming [`build.commonjsOptions.defaultIsModuleExports`](https://github.com/rollup/plugins/tree/master/packages/commonjs#defaultismoduleexports) is not changed from the default `'auto'`)

:::

See Rolldown's document about this problem for more details: [Ambiguous `default` import from CJS modules - Bundling CJS | Rolldown](https://rolldown.rs/in-depth/bundling-cjs#ambiguous-default-import-from-cjs-modules).

This change may break some existing code importing CJS modules. You can use the `legacy.inconsistentCjsInterop: true` option to temporary restore the previous behavior. Note that this option will be removed in the future. If you find a package that is affected by this change, please report it to the package author. Make sure to link to the Rolldown document above so that the author can understand the context.

### Module Type Support and Auto Detection

This change only affects plugin authors.

Rolldown has an experimental [Module type support](https://rolldown.rs/guide/notable-features#module-types), which is similar to [esbuild's `loader` option](https://esbuild.github.io/api/#loader). Due to this, Rolldown automatically sets a module type based on the extension of the resolved id.

If you are converting the content to JavaScript from other types in `load` or `transform` hooks, you may need to add `moduleType: 'js'` to the returned value.

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

### Removed Module Resolution Using Format Sniffing

When both `browser` and `module` fields are present in `package.json`, Vite used to resolve the field based on the content of the file, trying to pick the ESM file for browsers. This was introduced because some packages were using the `module` field to point to ESM files for Node.js and some other packages were using the `browser` field to point to UMD files for browsers. Given that the modern `exports` field solved this problem and is now adopted by many packages, Vite no longer uses this heuristic and always respects the order of the [`resolve.mainFields`](/config/shared-options#resolve-mainfields) option. If you were relying on this behavior, you can use the [`resolve.alias`](/config/shared-options#resolve-alias) option to map the field to the desired file or apply a patch with your package manager (e.g. `patch-package`, `pnpm patch`).

### Require Calls For Externalized Modules

`require` calls for externalized modules are now preserved as `require` calls and not converted to `import` statements. This is to preserve the semantics of `require` calls.

If you want to convert them to `import` statements, you can use Rolldown's built-in `esmExternalRequirePlugin`, which is re-exported from `vite`.

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

See Rolldown's document for more details: [`require` external modules - Bundling CJS | Rolldown](https://rolldown.rs/in-depth/bundling-cjs#require-external-modules).

### `import.meta.url` in UMD / IIFE

`import.meta.url` is not polyfilled in UMD / IIFE output formats. It will be replaced with `undefined` by default. If you prefer the previous behavior, you can use the `define` option with `build.rolldownOptions.output.intro` option. See Rolldown's document for more details: [Well-known `import.meta` properties - Non ESM Output Formats | Rolldown](https://rolldown.rs/in-depth/non-esm-output-formats#well-known-import-meta-properties).

### Removed `build.rollupOptions.watch.chokidar` option

`build.rollupOptions.watch.chokidar` option is removed. Please migrate to `build.rolldownOptions.watch.notify` option.

<!-- TODO: add link to rolldownOptions.watch.notify -->

### Deprecate `build.rollupOptions.output.manualChunks`

`output.manualChunks` option is deprecated. Rolldown has `advacedChunks` option, which is more flexible. Please migrate to `output.advancedChunks` option. See Rolldown's document for more details about `advancedChunks`: [Advanced Chunks - Rolldown](https://rolldown.rs/in-depth/advanced-chunks).

<!-- TODO: add link to rolldownOptions.output.advancedChunks -->

### Other Related Deprecations

The following options are deprecated and will be removed in the future:

- `build.rollupOptions`: renamed to `build.rolldownOptions`
- `worker.rollupOptions`: renamed to `worker.rolldownOptions`
- `build.commonjsOptions`: it is now no-op

## General Changes

## Removed deprecated features

**_TODO: This change is not implemented yet, but will be implemented before stable release._**

## Advanced

There are other breaking changes which only affect few users.

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
