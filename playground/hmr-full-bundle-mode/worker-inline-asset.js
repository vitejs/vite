import WorkerInlineAsset from './worker-inline-asset-src.js?worker&inline'

const worker = new WorkerInlineAsset()
worker.postMessage('ping')
worker.addEventListener('message', (e) => {
  document.querySelector('.worker-inline-asset').textContent = e.data
})

import.meta.hot?.accept()
import.meta.hot?.dispose(() => worker.terminate())
