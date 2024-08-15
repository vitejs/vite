export function startWorker(handler) {
  const worker = new Worker(new URL('./worker.js', import.meta.url), {
    type: 'module',
  })
  worker.postMessage('main')
  worker.addEventListener('message', (e) => {
    handler(e)
  })
}
