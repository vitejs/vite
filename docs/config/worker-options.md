# Worker Options

Options related to Web Workers.

## worker.format

- **Type:** `'es' | 'iife'`
- **Default:** `iife`

Output format for worker bundle.

## worker.plugins

- **Type:** [`(Plugin | Plugin[])[]`](./shared-options#plugins)

Vite plugins that apply to worker bundle. Note that [config.plugins](./shared-options#plugins) does not apply to workers, it should be configured here instead.

## worker.rollupOptions

- **Type:** [`RollupOptions`](https://rollupjs.org/guide/en/#big-list-of-options)

Rollup options to build worker bundle.
