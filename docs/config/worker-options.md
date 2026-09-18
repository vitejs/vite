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

**How it works:** without this option, each `?worker`/`?sharedworker` import (and each `new Worker(new URL(...), { type: 'module' })` reference) is bundled through its own, independent call into the bundler, isolated from the main build and from every other worker. If two workers - or a worker and the main entry - both import the same module, that module gets bundled into each of them separately, because there's no single, shared build graph for the bundler to notice the duplication across those independent calls. With `shareChunks` enabled, a worker's entry is instead folded into the _same_ build graph as the main bundle - the same graph that already lets, say, two HTML entries or two [`build.lib`](./build-options.md#build-lib) entries sharing a dependency end up with one common chunk automatically, with no `manualChunks` needed. So if `worker-a.js` and `worker-b.js` both import `utils.js`, `utils.js` is extracted into its own chunk once, and both workers - and the main bundle too, if it also imports `utils.js` - import from that single chunk instead of each bundling their own copy of it.

This changes two things about how the worker's own code is produced, which is why the option exists to opt out of:

- The worker's chunk is written using [`build.rolldownOptions.output`](./build-options.md#build-rolldownoptions)'s file-naming options, not `worker.rolldownOptions.output`'s: since the worker's chunk is now part of the main build's own output rather than a separate one, there's only one naming scheme for the whole build to follow. `entryFileNames`, `chunkFileNames`, and `assetFileNames` set on `worker.rolldownOptions.output` have no effect while `shareChunks` is enabled (Vite warns once if it detects this).
- [`worker.plugins`](#worker-plugins) isn't applied to the worker's code either, for the same reason: there's no separate worker build for it to run against.

Set `worker.shareChunks: false` to go back to bundling every worker in isolation - for example if you rely on `worker.plugins`, on the worker-specific output naming above, or if a worker genuinely needs to be self-contained (deployed or fetched separately from the rest of the build, say).

## worker.shareChunkOnInline

- **Type:** `boolean`
- **Default:** `false`

Whether `?worker&inline` (and `?sharedworker&inline`) workers also participate in chunk sharing (see [`worker.shareChunks`](#worker-sharechunks)) instead of being bundled in isolation and embedded as a blob/data URL, as they are by default.

This is a separate switch from `shareChunks` because inlining and chunk sharing pull in opposite directions, and enabling this one changes what "inline" actually produces: normally, `?worker&inline` bundles the worker's entire dependency tree into one self-contained string with no external references, so it can be embedded directly in the importing chunk and needs no extra network request to load. A chunk shared with other code, by definition, lives in its own separate file that has to be fetched independently - there's no way to both embed a worker's code inline _and_ have it reference an external chunk. So setting `shareChunkOnInline: true` doesn't mean the worker gets inlined **and** shares chunks: it means the `inline` query is effectively overridden for chunk-sharing purposes, and that worker is emitted as a normal, separately-fetched chunk file instead - deduplicated against any other worker (or the main build) that imports the same modules, exactly like a non-inline worker under `shareChunks`. You gain deduplication and lose the "no extra request, portable single file" property that made it `inline` in the first place, so only turn this on if that trade-off is what you actually want for a given inline worker.

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
