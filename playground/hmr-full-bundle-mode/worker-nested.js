const worker = new Worker(
  new URL('./worker-nested-outer.js', import.meta.url),
  {
    type: 'module',
  },
)
worker.postMessage('ping')
worker.addEventListener('message', (e) => {
  document.querySelector('.worker-nested').textContent = e.data
})
worker.addEventListener('error', () => {
  document.querySelector('.worker-nested').textContent = 'nested-outer-error'
})

import.meta.hot?.accept()
import.meta.hot?.dispose(() => worker.terminate())
