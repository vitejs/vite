// Run when testing worker.shareChunks (default: true, format: 'es').
//
// dce-test-importer.js's export is unused below, so the ?worker import it
// wraps must not survive tree-shaking. dce-test-live-worker.js IS used, but
// its own unused import of dce-test-live-worker-importer.js must not survive
// tree-shaking either. See the "dead code elimination" test.
import { dceTestWorker as _dceTestWorker } from '../dce-test-importer.js'
import DceTestLiveWorker from '../dce-test-live-worker.js?worker'
import { isBool, sharedChunkMarker } from '../shared-chunks/common.js'
import WorkerA from '../shared-chunks/worker-a.js?worker'
import InlineWorker from '../shared-chunks/worker-a.js?worker&inline'
import WorkerB from '../shared-chunks/worker-b.js?worker'

function text(el, text) {
  document.querySelector(el).textContent = text
}

// the main thread importing the same module as the workers below is what
// exercises https://github.com/vitejs/vite/issues/16719
text('.shared-chunks-main', JSON.stringify([sharedChunkMarker, isBool('x')]))

const workerA = new WorkerA()
workerA.addEventListener('message', (ev) => {
  text('.shared-chunks-worker-a', JSON.stringify(ev.data))
})
workerA.postMessage('ping')

const workerB = new WorkerB()
workerB.addEventListener('message', (ev) => {
  text('.shared-chunks-worker-b', JSON.stringify(ev.data))
})
workerB.postMessage('ping')

const inlineWorker = new InlineWorker()
inlineWorker.addEventListener('message', (ev) => {
  text('.shared-chunks-worker-inline', JSON.stringify(ev.data))
})
inlineWorker.postMessage('ping')

new DceTestLiveWorker()
