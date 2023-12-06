# Worker Options

Options related to Web Workers.

## worker.format

- **Type:** `'es' | 'iife'`
- **Default:** `'iife'`

Output format for worker bundle.

## worker.plugins

- **Type:** [`() => (Plugin | Plugin[])[]`](./shared-options#plugins)

Vite plugins that apply to the worker bundles. Note that [config.plugins](./shared-options#plugins) only applies to workers in dev, it should be configured here instead for build.
The function should return new plugin instances as they are used in parallel rollup worker builds. As such, modifying `config.worker` options in the `config` hook will be ignored.

## worker.rollupOptions

- **Type:** [`RollupOptions`](https://rollupjs.org/configuration-options/)

Rollup options to build worker bundle.
