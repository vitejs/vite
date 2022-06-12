# Worker Options

## worker.format

- **Type:** `'es' | 'iife'`
- **Default:** `iife`

Output format for worker bundle.

## worker.plugins

- **Type:** [`(Plugin | Plugin[])[]`](./shared-options#plugins)

Vite plugins that apply to worker bundle. Note `config.plugin` is not apply to worker, we should config the specific plugins of bundle worker.

## worker.rollupOptions

- **Type:** [`RollupOptions`](https://rollupjs.org/guide/en/#big-list-of-options)

Rollup options to build worker bundle.
