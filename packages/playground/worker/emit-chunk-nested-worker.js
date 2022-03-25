import SubWorker from './emit-chunk-sub-worker?worker'

const subWorker = new SubWorker()

subWorker.onmessage = (event) => {
  self.postMessage(event.data)
}
