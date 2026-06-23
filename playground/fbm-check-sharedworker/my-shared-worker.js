// Shared-worker module bundled by Vite's `vite:worker` plugin and spawned via
// `?sharedworker`. Mirrors playground/worker/my-shared-worker.ts: it replies `msg`
// once at least two ports have connected (Vite's own test connects twice and asserts
// the reply). The HMR edit flips `msg`.
let sharedWorkerCount = 0
const msg = 'pong'

// `onconnect` exists on a SharedWorkerGlobalScope.
self.onconnect = (event) => {
  sharedWorkerCount++
  const port = event.ports[0]
  if (sharedWorkerCount >= 2) {
    port.postMessage(msg)
  }
}
