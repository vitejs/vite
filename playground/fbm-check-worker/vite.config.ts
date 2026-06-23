import { defineConfig } from 'vite'

// Faithful FBM port of Vite's `?worker` cases from playground/worker.
//
// `import MyWorker from './my-worker.js?worker'` -> a constructor; `new MyWorker()`
// spawns a Web Worker. The worker module is bundled SEPARATELY by Vite's
// `vite:worker` plugin (`bundleWorkerEntry` -> a dedicated Rolldown bundle, cached in
// `WorkerOutputCache`) and emitted as `/assets/<name>-<hash>.js`; the wrapper does
// `new Worker(<emitted-url>, { type: "module" })` (plugins/worker.ts:481-521).
//   - `?worker&inline` -> the worker is bundled inline as a Blob/data: URL, no separate
//     emitted file (plugins/worker.ts:431-480).
//   - `?worker&url`    -> the import returns the worker URL string instead of a
//     constructor (plugins/worker.ts:506-511).
//
// The ONLY intended change vs. the non-FBM playground/worker is enabling FBM.
export default defineConfig({
  experimental: {
    bundledDev: true,
  },
})
