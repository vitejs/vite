export function startWorkerEsm(handler) {
  const worker = new Worker(new URL('./worker-esm.js', import.meta.url), {
    type: 'module',
  })
  worker.addEventListener('message', (e) => {
    handler(e)
  })
}

export function startWorkerClassic(handler) {
  const worker = new Worker(new URL('./worker-classic.js', import.meta.url))
  worker.addEventListener('message', (e) => {
    handler(e)
  })
}
