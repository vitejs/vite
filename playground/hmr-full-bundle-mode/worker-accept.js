import WorkerAccept from './worker-accept-src.js?worker'

// Self-accepting keeps an edit to the worker source on the HMR patch path.
// Without a boundary here the update escalates to a full reload, which
// regenerates the whole bundle and hides whether the patch carried the worker.
const worker = new WorkerAccept()
worker.postMessage('ping')
worker.addEventListener('message', (e) => {
  document.querySelector('.worker-accept').textContent = e.data
})

import.meta.hot?.accept()
import.meta.hot?.dispose(() => worker.terminate())
