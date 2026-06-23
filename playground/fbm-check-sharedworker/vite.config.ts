import { defineConfig } from 'vite'

// Faithful FBM port of Vite's `?sharedworker` cases from playground/worker.
//
// `import MySharedWorker from './my-shared-worker.js?sharedworker'` -> a constructor;
// `const sw = new MySharedWorker(); sw.port.start(); sw.port.postMessage(...)` connects
// to a SharedWorker. `?sharedworker` is handled by the SAME `vite:worker` plugin/`load`
// handler as `?worker` (plugins/worker.ts:407-522) -- the only difference is
// `workerConstructor = 'SharedWorker'` (worker.ts:415). The shared-worker module is
// bundled SEPARATELY by `bundleWorkerEntry` (a dedicated Rolldown bundle cached in
// `WorkerOutputCache`) and emitted as `/assets/<name>-<hash>.js`; the wrapper does
// `new SharedWorker(<emitted-url>, { type: "module" })` (worker.ts:481-521).
//   - `?sharedworker&inline` -> bundled inline. For SharedWorker the inline path uses
//     ONLY a `data:text/javascript` URL, NOT a Blob/createObjectURL (worker.ts:440-441
//     comment: "Using blob URL for SharedWorker results in multiple instances").
//   - `?sharedworker&url` -> the import returns the worker URL string instead of a
//     constructor (worker.ts:506-511, same `urlRE` branch as `?worker&url`).
//
// The ONLY intended change vs. the non-FBM playground/worker is enabling FBM.
export default defineConfig({
  experimental: {
    bundledDev: true,
  },
})
