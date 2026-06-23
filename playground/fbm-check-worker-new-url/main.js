function text(el, value) {
  document.querySelector(el).textContent = value
}

// `new Worker(new URL('./my-worker.js', import.meta.url), { type: 'module' })`
// — the import.meta.url worker form (the exact shape GOAL.md §6 enumerates).
// Vite's `vite:worker-import-meta-url` plugin detects this pattern and rewrites the
// `new URL(...)` to the emitted worker URL. The worker options must be a STATIC inline
// object literal (`{ type: 'module' }`) so the plugin can infer the worker type
// (plugins/workerImportMetaUrl.ts getWorkerType/parseWorkerOptions). This mirrors
// playground/worker/worker/main-module.js L113-119 (`new Worker(new URL('../url-worker.js',
// import.meta.url), workerOptions)` with `workerOptions = { type: 'module' }`).
const worker = new Worker(new URL('./my-worker.js', import.meta.url), {
  type: 'module',
})
worker.postMessage('ping')
worker.addEventListener('message', (e) => {
  // e.data = { msg, url } — msg is the round-trip reply; url is the worker's own
  // location (the actual URL it was loaded from), used to assert it's a real served
  // asset rather than an unresolved placeholder/404.
  text('.pong', e.data.msg)
  text('.worker-url', e.data.url)
})
