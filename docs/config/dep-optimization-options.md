# Dep Optimization Options

- **Related:** [Dependency Pre-Bundling](/guide/dep-pre-bundling)

## optimizeDeps.entries

- **Type:** `string | string[]`

By default, Vite will crawl all your `.html` files to detect dependencies that need to be pre-bundled (ignoring `node_modules`, `build.outDir`, `__tests__` and `coverage`). If `build.rollupOptions.input` is specified, Vite will crawl those entry points instead.

If neither of these fit your needs, you can specify custom entries using this option - the value should be a [fast-glob pattern](https://github.com/mrmlnc/fast-glob#basic-syntax) or array of patterns that are relative from Vite project root. This will overwrite default entries inference. Only `node_modules` and `build.outDir` folders will be ignored by default when `optimizeDeps.entries` is explicitly defined. If other folders needs to be ignored, you can use an ignore pattern as part of the entries list, marked with an initial `!`.

## optimizeDeps.exclude

- **Type:** `string[]`

Dependencies to exclude from pre-bundling.

:::warning CommonJS
CommonJS dependencies should not be excluded from optimization. If an ESM dependency is excluded from optimization, but has a nested CommonJS dependency, the CommonJS dependency should be added to `optimizeDeps.include`. Example:

```js
export default defineConfig({
  optimizeDeps: {
    include: ['esm-dep > cjs-dep']
  }
})
```

:::

## optimizeDeps.include

- **Type:** `string[]`

By default, linked packages not inside `node_modules` are not pre-bundled. Use this option to force a linked package to be pre-bundled.

## optimizeDeps.esbuildOptions

- **Type:** [`EsbuildBuildOptions`](https://esbuild.github.io/api/#simple-options)

Options to pass to esbuild during the dep scanning and optimization.

Certain options are omitted since changing them would not be compatible with Vite's dep optimization.

- `external` is also omitted, use Vite's `optimizeDeps.exclude` option
- `plugins` are merged with Vite's dep plugin
