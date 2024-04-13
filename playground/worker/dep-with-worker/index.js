import { sharedBetweenWorkerAndMain } from './shared.js'

export function startWorker(el) {
  sharedBetweenWorkerAndMain(el, 'entry: main')

  const worker = new Worker(
    new URL('./dep-worker.js?worker', import.meta.url),
    {
      type: 'module',
    },
  )
  worker.addEventListener('message', (e) => {
    console.log('message', e)
    sharedBetweenWorkerAndMain(el, e.data.msg)
  })
  worker.postMessage({ msg: 'pong: worker' })
}
