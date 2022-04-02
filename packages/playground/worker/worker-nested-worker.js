import SubWorker from './sub-worker?worker'

const subWorker = new SubWorker()

self.onmessage = (event) => {
  if (event.data === 'ping') {
    subWorker.postMessage('ping')
  }
}

subWorker.onmessage = (event) => {
  self.postMessage(event.data)
}
