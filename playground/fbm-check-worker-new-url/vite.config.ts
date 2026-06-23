import { defineConfig } from 'vite'

// Faithful FBM port of Vite's `new Worker(new URL(..., import.meta.url), { type: 'module' })`
// case from playground/worker (worker/main-module.js L113-119, asserted by
// worker-es.spec.ts `test('module worker')` L146-159 via `.worker-import-meta-url`).
//
// `new Worker(new URL('./my-worker.js', import.meta.url), { type: 'module' })` is detected by
// Vite's `vite:worker-import-meta-url` plugin (plugins/workerImportMetaUrl.ts). In the bundled
// (FBM) path (`isBundled === true`) it calls `workerFileToUrl(config, file)` -> the SAME
// dedicated worker bundle + `WorkerOutputCache` machinery as `?worker`
// (plugins/worker.ts:310-326 / 162-308), rewrites the `new URL(...)` to the emitted worker URL
// via `toOutputFilePathInJSForBundledDev` when `command === 'serve'`
// (workerImportMetaUrl.ts:257-263), and `addWatchFile`s every file the worker bundle touched
// (workerImportMetaUrl.ts:267-269) — exactly like the `?worker` load handler (worker.ts:496-498).
//
// The ONLY intended change vs. the non-FBM playground/worker is enabling FBM.
export default defineConfig({
  experimental: {
    bundledDev: true,
  },
})
