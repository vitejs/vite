export function startWorkerRecursvie(handler) {
  const worker = new Worker(new URL('./worker-recursive.js', import.meta.url), {
    type: 'module',
  })
  worker.addEventListener('message', (e) => {
    handler(e)
  })
  worker.postMessage('main')
}
