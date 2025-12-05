# Worker Options

Unless noted, the options in this section are applied to all dev, build, and preview.

## worker.format

- **Type:** `'es' | 'iife'`
- **Default:** `'iife'`

Output format for worker bundle.

## worker.plugins

- **Type:** [`() => (Plugin | Plugin[])[]`](./shared-options#plugins)

Vite plugins that apply to the worker bundles. Note that [config.plugins](./shared-options#plugins) only applies to workers in dev, it should be configured here instead for build.
The function should return new plugin instances as they are used in parallel rollup worker builds. As such, modifying `config.worker` options in the `config` hook will be ignored.

## worker.rolldownOptions

<!-- TODO: update the link below to Rolldown's documentation -->

- **Type:** [`RolldownOptions`](https://rollupjs.org/configuration-options/)

Rollup options to build worker bundle.

## worker.rollupOptions

- **Type:** `RolldownOptions`
- **Deprecated**

This option is an alias of `worker.rolldownOptions` option. Use `worker.rolldownOptions` option instead.
