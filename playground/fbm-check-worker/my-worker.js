// Worker module bundled by Vite's `vite:worker` plugin and spawned via `?worker`.
// Mirrors the shape of playground/worker/my-worker.ts: replies to a 'ping' message
// with `msg`, and also posts `msg` once on startup. The HMR edit flips `msg`.
const msg = 'pong'

self.onmessage = (e) => {
  if (e.data === 'ping') {
    self.postMessage(msg)
  }
}
