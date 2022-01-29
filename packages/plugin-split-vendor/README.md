# @vitejs/plugin-split-vendor [![npm](https://img.shields.io/npm/v/@vitejs/plugin-split-vendor.svg)](https://npmjs.com/package/@vitejs/plugin-split-vendor)

You can configure how chunks are split using `build.rollupOptions.manualChunks` (see [Rollup docs](https://rollupjs.org/guide/en/#outputmanualchunks)). Until Vite 2.7, the default chunking strategy divided the chunks into `index` and `vendor`. It is a good strategy for some SPAs, but it is hard to provide a general solution for every Vite target use case. From Vite 2.8, `manualChunks` is no longer modified by default. You can continue to use the Split Vendor Chunk strategy by adding the `splitVendorPlugin` from the `@vitejs/plugin-split-vendor` package in your config file:

```js
// vite.config.js
import { splitVendorPlugin } from '@vitejs/plugin-split-vendor'
module.exports = defineConfig({
  plugins: [splitVendorPlugin()]
})
```

This strategy is also provided as a `splitVendor({ cache: SplitVendorCache })` factory, in case composition with custom logic is needed. `cache.reset()` needs to be called at `buildStart` for build watch mode to work correctly in this case.
