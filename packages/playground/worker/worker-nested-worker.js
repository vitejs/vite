import SubWorker from './sub-worker?worker'

const subWorker = new SubWorker()

self.onmessage = (event) => {
  if (event.data === 'ping') {
    subWorker.postMessage('ping')
  }
}

self.postMessage(import.meta.url)

subWorker.onmessage = (ev) => {
  self.postMessage({
    type: 'module',
    data: ev.data
  })
}

const classicWorker = new Worker(new URL('./url-worker.js', import.meta.url), {
  type: 'module'
})
classicWorker.addEventListener('message', (ev) => {
  self.postMessage({
    type: 'constructor',
    data: ev.data
  })
})
