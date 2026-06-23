// Inline shared-worker module spawned via `?sharedworker&inline`. Mirrors
// playground/worker/my-inline-shared-worker.ts: separate connection counter so the
// inline round-trip is independent from the emitted one. Replies once two ports connect.
let inlineSharedWorkerCount = 0

self.onconnect = (event) => {
  inlineSharedWorkerCount++
  const port = event.ports[0]
  if (inlineSharedWorkerCount >= 2) {
    port.postMessage('pong')
  }
}
