import MySharedWorker from './my-shared-worker.js?sharedworker'
import InlineSharedWorker from './my-inline-shared-worker.js?sharedworker&inline'
import sharedWorkerUrl from './url-shared-worker.js?sharedworker&url'

function text(el, value) {
  document.querySelector(el).textContent = value
}

// ?sharedworker — separate emitted worker bundle, wrapper does
// `new SharedWorker(<emitted-url>, { type: "module" })`. The shared worker replies
// once two ports have connected, so (mirroring Vite's playground/worker main-module.js
// `startSharedWorker(); startSharedWorker()`) we connect twice and read the reply.
const startSharedWorker = () => {
  const sw = new MySharedWorker()
  sw.port.addEventListener('message', (event) => {
    text('.pong', event.data)
  })
  sw.port.start()
}
startSharedWorker()
startSharedWorker()

// ?sharedworker&inline — bundled inline as a data: URL (SharedWorker cannot use a Blob
// URL or each connection would be a different instance — see worker.ts:440).
const startInlineSharedWorker = () => {
  const sw = new InlineSharedWorker()
  sw.port.addEventListener('message', (event) => {
    text('.pong-inline', event.data)
  })
  sw.port.start()
}
startInlineSharedWorker()
startInlineSharedWorker()

// ?sharedworker&url — the import is the worker URL string itself.
text('.worker-url', sharedWorkerUrl)

// Prove the ?sharedworker&url value actually loads a shared worker.
const startUrlSharedWorker = () => {
  const sw = new SharedWorker(sharedWorkerUrl, { type: 'module' })
  sw.port.addEventListener('message', (event) => {
    text('.pong-url', event.data)
  })
  sw.port.start()
}
startUrlSharedWorker()
startUrlSharedWorker()
