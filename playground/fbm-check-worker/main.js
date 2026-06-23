import MyWorker from './my-worker.js?worker'
import InlineWorker from './my-worker.js?worker&inline'
import workerUrl from './my-worker.js?worker&url'

function text(el, value) {
  document.querySelector(el).textContent = value
}

// ?worker — separate emitted worker bundle, wrapper does
// `new Worker(<emitted-url>, { type: "module" })`. Round-trip ping/pong.
const worker = new MyWorker()
worker.postMessage('ping')
worker.addEventListener('message', (e) => {
  text('.pong', e.data)
})

// ?worker&inline — worker bundled inline as a Blob/data: URL. Round-trip ping/pong.
const inlineWorker = new InlineWorker()
inlineWorker.postMessage('ping')
inlineWorker.addEventListener('message', (e) => {
  text('.pong-inline', e.data)
})

// ?worker&url — the import is the worker URL string itself.
text('.worker-url', workerUrl)

// Prove the ?worker&url value actually loads a worker.
const urlWorker = new Worker(workerUrl, { type: 'module' })
urlWorker.postMessage('ping')
urlWorker.addEventListener('message', (e) => {
  text('.pong-url', e.data)
})
