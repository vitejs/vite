// Worker module spawned via `new Worker(new URL('./my-worker.js', import.meta.url),
// { type: 'module' })`. Mirrors the round-trip shape of playground/worker/my-worker.ts:
// replies to a 'ping' message. The HMR edit flips `msg`.
// (Vite's own url-worker.js only posts once on startup; a ping/pong round-trip is a
// strictly stronger check that the spawned worker is live and reachable.)
//
// The reply carries BOTH the message and the worker's OWN location URL
// (`self.location.href`) — this is the actual URL the worker was loaded from, so the
// test can assert it is a REAL served asset (not a `__ROLLDOWN_ASSET__` placeholder/404)
// without having to read back the (plugin-rewritten) `new URL(...)` argument.
const msg = 'pong'

self.onmessage = (e) => {
  if (e.data === 'ping') {
    self.postMessage({ msg, url: self.location.href })
  }
}
