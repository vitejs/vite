import SubWorker from './emit-chunk-sub-worker?worker'
const subWorker = new SubWorker()

subWorker.onmessage = (event) => {
  self.postMessage({
    type: 'emit-chunk-sub-worker',
    data: event.data,
  })
}

const moduleWorker = new Worker(
  new URL('./module-and-worker.js', import.meta.url),
  { type: 'module' },
)

moduleWorker.onmessage = (event) => {
  self.postMessage({
    type: 'module-and-worker:worker',
    data: event.data,
  })
}

import('./module-and-worker').then((res) => {
  self.postMessage({
    type: 'module-and-worker:module',
    data: res.module,
  })
})

// for sourcemap
console.log('emit-chunk-nested-worker.js')
