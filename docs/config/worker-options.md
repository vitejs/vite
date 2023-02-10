# Worker Options

Options related to Web Workers.

## worker.format

- **Type:** `'es' | 'iife'`
- **Default:** `'iife'`

Output format for worker bundle.

## worker.inlineUrl

- **Type:** `'blob' | 'data'`
- **Default:** `'blob'`

URL type for inline worker, when setting to `'blob'`, the worker will be loaded as a blob URL with a fallback to data URL. Set to `'data'` to load the worker as a data URL.

## worker.plugins

- **Type:** [`(Plugin | Plugin[])[]`](./shared-options#plugins)

Vite plugins that apply to worker bundle. Note that [config.plugins](./shared-options#plugins) only applies to workers in dev, it should be configured here instead for build.

## worker.rollupOptions

- **Type:** [`RollupOptions`](https://rollupjs.org/configuration-options/)

Rollup options to build worker bundle.
