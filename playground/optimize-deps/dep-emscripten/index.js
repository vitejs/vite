export function startWorker(handler) {
  const worker = new Worker(new URL('./worker.js', import.meta.url), {
    type: 'module',
  })
  worker.addEventListener('message', (e) => {
    handler(e)
  })
  worker.postMessage('ping')
}
