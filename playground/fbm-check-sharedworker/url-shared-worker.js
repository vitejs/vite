// Shared-worker module referenced via `?sharedworker&url` (the import is the URL
// string; main.js builds `new SharedWorker(url, { type: 'module' })`). Mirrors
// playground/worker/url-shared-worker.js. Replies once two ports connect.
let urlSharedWorkerCount = 0

self.onconnect = (event) => {
  urlSharedWorkerCount++
  const port = event.ports[0]
  if (urlSharedWorkerCount >= 2) {
    port.postMessage('pong')
  }
}
