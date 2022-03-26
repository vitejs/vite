import SubWorker from './emit-chunk-sub-worker?worker'

const subWorker = new SubWorker()

subWorker.onmessage = (event) => {
  self.postMessage({
    type: 'emit-chunk-sub-worker',
    data: event.data
  })
}

const moduleWorker = new Worker(
  new URL('./module-and-worker.js', import.meta.url)
)

moduleWorker.onmessage = (event) => {
  self.postMessage({
    type: 'module-and-worker',
    data: event.data
  })
}
