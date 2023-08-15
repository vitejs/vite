# Worker Options

Options related to Web Workers.

## worker.format

- **Type:** `'es' | 'iife'`
- **Default:** `'iife'`

Output format for worker bundle.

## worker.plugins

- **Type:** [`(() => (Plugin | Plugin[])[]) | (Plugin | Plugin[])[]`](./shared-options#plugins)

Vite plugins that apply to worker bundle. Note that [config.plugins](./shared-options#plugins) only applies to workers in dev, it should be configured here instead for build.

Providing a function that returns an array of plugins is preferred, so we can safely run parallel builds for workers. The function should be side effect free and return the same array of plugins every time.

When providing an array of plugins, the worker builds will run sequentially and workers nested inside other workers may not build.

## worker.rollupOptions

- **Type:** [`RollupOptions`](https://rollupjs.org/configuration-options/)

Rollup options to build worker bundle.
