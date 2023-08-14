# Dep Optimization Options

- **Related:** [Dependency Pre-Bundling](/guide/dep-pre-bundling)

## optimizeDeps.entries

- **Type:** `string | string[]`

By default, Vite will crawl all your `.html` files to detect dependencies that need to be pre-bundled (ignoring `node_modules`, `build.outDir`, `__tests__` and `coverage`). If `build.rollupOptions.input` is specified, Vite will crawl those entry points instead.

If neither of these fit your needs, you can specify custom entries using this option - the value should be a [fast-glob pattern](https://github.com/mrmlnc/fast-glob#basic-syntax) or array of patterns that are relative from Vite project root. This will overwrite default entries inference. Only `node_modules` and `build.outDir` folders will be ignored by default when `optimizeDeps.entries` is explicitly defined. If other folders need to be ignored, you can use an ignore pattern as part of the entries list, marked with an initial `!`.

## optimizeDeps.exclude

- **Type:** `string[]`

Dependencies to exclude from pre-bundling.

:::warning CommonJS
CommonJS dependencies should not be excluded from optimization. If an ESM dependency is excluded from optimization, but has a nested CommonJS dependency, the CommonJS dependency should be added to `optimizeDeps.include`. Example:

```js
export default defineConfig({
  optimizeDeps: {
    include: ['esm-dep > cjs-dep'],
  },
})
```

:::

## optimizeDeps.include

- **Type:** `string[]`

By default, linked packages not inside `node_modules` are not pre-bundled. Use this option to force a linked package to be pre-bundled.

**Experimental:** If you're using a library with many deep imports, you can also specify a trailing glob pattern to pre-bundle all deep imports at once. This will avoid constantly pre-bundling whenever a new deep import is used. For example:

```js
export default defineConfig({
  optimizeDeps: {
    include: ['my-lib/components/**/*.vue'],
  },
})
```

## optimizeDeps.esbuildOptions

- **Type:** [`EsbuildBuildOptions`](https://esbuild.github.io/api/#simple-options)

Options to pass to esbuild during the dep scanning and optimization.

Certain options are omitted since changing them would not be compatible with Vite's dep optimization.

- `external` is also omitted, use Vite's `optimizeDeps.exclude` option
- `plugins` are merged with Vite's dep plugin

## optimizeDeps.force

- **Type:** `boolean`

Set to `true` to force dependency pre-bundling, ignoring previously cached optimized dependencies.

## optimizeDeps.disabled

- **Experimental:** [Give Feedback](https://github.com/vitejs/vite/discussions/13839)
- **Type:** `boolean | 'build' | 'dev'`
- **Default:** `'build'`

Disables dependencies optimizations, `true` disables the optimizer during build and dev. Pass `'build'` or `'dev'` to only disable the optimizer in one of the modes. Dependency optimization is enabled by default in dev only.

:::warning
Optimizing dependencies in build mode is **experimental**. If enabled, it removes one of the most significant differences between dev and prod. [`@rollup/plugin-commonjs`](https://github.com/rollup/plugins/tree/master/packages/commonjs) is no longer needed in this case since esbuild converts CJS-only dependencies to ESM.

If you want to try this build strategy, you can use `optimizeDeps.disabled: false`. `@rollup/plugin-commonjs` can be removed by passing `build.commonjsOptions: { include: [] }`.
:::

## optimizeDeps.needsInterop

- **Experimental**
- **Type:** `string[]`

Forces ESM interop when importing these dependencies. Vite is able to properly detect when a dependency needs interop, so this option isn't generally needed. However, different combinations of dependencies could cause some of them to be prebundled differently. Adding these packages to `needsInterop` can speed up cold start by avoiding full-page reloads. You'll receive a warning if this is the case for one of your dependencies, suggesting to add the package name to this array in your config.
