import WorkerAccept from './worker-accept-src.js?worker'

const worker = new WorkerAccept()
worker.postMessage('ping')
worker.addEventListener('message', (e) => {
  document.querySelector('.worker-accept').textContent = e.data
})

import.meta.hot?.accept()
import.meta.hot?.dispose(() => worker.terminate())
