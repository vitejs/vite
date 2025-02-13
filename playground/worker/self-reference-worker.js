import SelfWorker from './self-reference-worker?worker'

self.addEventListener('message', (e) => {
  if (e.data === 'main') {
    const selfWorker = new SelfWorker()
    selfWorker.postMessage('nested')
    selfWorker.addEventListener('message', (e) => {
      self.postMessage(e.data)
    })
  }

  self.postMessage(`pong: ${e.data}`)
})
