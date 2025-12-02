# Worker Options

Unless noted, the options in this section are applied to all dev, build, and preview.

## worker.format

- **Type:** `'es' | 'iife' | 'cjs'`
- **Default:** `'iife'`

Output format for worker bundle. When using [`?nodeWorker`](/guide/features#node-worker-imports), prefer `'es'` or `'cjs'`. Other formats will be coerced to `'cjs'` for Node worker builds.

## worker.plugins

- **Type:** [`() => (Plugin | Plugin[])[]`](./shared-options#plugins)

Vite plugins that apply to the worker bundles. Note that [config.plugins](./shared-options#plugins) only applies to workers in dev, it should be configured here instead for build.
The function should return new plugin instances as they are used in parallel rollup worker builds. As such, modifying `config.worker` options in the `config` hook will be ignored.

## worker.rollupOptions

- **Type:** [`RollupOptions`](https://rollupjs.org/configuration-options/)

Rollup options to build worker bundle.
