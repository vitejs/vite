function text(el, text) {
  document.querySelector(el).textContent = text
}

const logWorker = new Worker(
  new URL('./workers/log-worker.js', import.meta.url),
  {
    type: 'module'
  }
)

logWorker.postMessage('ping')

logWorker.addEventListener('message', (ev) => {
  text('.log-worker', ev.data)
})
