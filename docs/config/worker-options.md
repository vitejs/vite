# Worker Options

Unless noted, the options in this section are applied to all dev, build, and preview.

## worker.format

- **Type:** `'es' | 'iife'`
- **Default:** `'iife'`

Output format for worker bundle.

## worker.shareChunks

- **Type:** `boolean`
- **Default:** `true`

When `worker.format` is `'es'`, share chunks between multiple ES module workers, and between workers and the main build, instead of bundling each worker's dependencies in isolation. This only applies to `vite build` (dev and preview always serve unbundled, native ESM, so nothing to share there).

For example, if two separate workers (or a worker and the main entry) both import the same module, that module is extracted into its own chunk and imported by each of them, instead of being duplicated into every worker's bundle.

When enabled, [`worker.plugins`](#worker-plugins) and the output-naming options in `worker.rolldownOptions.output` (`entryFileNames`, `chunkFileNames`, `assetFileNames`) no longer apply: the worker's chunk is generated as part of the main build's chunk graph and follows [`build.rolldownOptions.output`](./build-options.md#build-rolldownoptions)'s naming instead, since a single build output can't follow two different naming schemes for the same chunk. Set `worker.shareChunks: false` if you rely on those options, or on `worker.plugins` applying to the worker's own bundling pass.

## worker.shareChunkOnInline

- **Type:** `boolean`
- **Default:** `false`

Whether `?worker&inline` (and `?sharedworker&inline`) workers also participate in chunk sharing (see [`worker.shareChunks`](#worker-sharechunks)). Disabled by default: an inlined worker is turned into a self-contained blob/data URL at runtime, so it can't reference external chunk files the way a normal, separately-emitted worker chunk can.

## worker.plugins

- **Type:** [`() => (Plugin | Plugin[])[]`](./shared-options#plugins)

Vite plugins that apply to the worker bundles. Note that [config.plugins](./shared-options#plugins) only applies to workers in dev, it should be configured here instead for build.
The function should return new plugin instances as they are used in parallel rolldown worker builds. As such, modifying `config.worker` options in the `config` hook will be ignored.

This option has no effect on a worker that goes through [`worker.shareChunks`](#worker-sharechunks) (the default for `format: 'es'`), since that worker is bundled as part of the main build rather than through a separate worker build.

## worker.rolldownOptions

- **Type:** [`RolldownOptions`](https://rolldown.rs/reference/)

Rolldown options to build worker bundle.

## worker.rollupOptions

- **Type:** `RolldownOptions`
- **Deprecated**

This option is an alias of `worker.rolldownOptions` option. Use `worker.rolldownOptions` option instead.
