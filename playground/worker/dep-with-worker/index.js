import { sharedBetweenWorkerAndMain } from './shared'

export function startWorker(el) {
  sharedBetweenWorkerAndMain(el, 'ping: main')

  const worker = new Worker(
    new URL('./dep-worker.mjs?worker', import.meta.url),
    {
      type: 'module ',
    },
  )
  worker.postMessage('pong: worker')
  worker.addEventListener('message', (e) => {
    sharedBetweenWorkerAndMain(el, e.data.msg)
  })
}
