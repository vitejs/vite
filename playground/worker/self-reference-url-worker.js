self.addEventListener('message', (e) => {
  if (e.data === 'main') {
    const selfWorker = new Worker(
      new URL('./self-reference-url-worker.js', import.meta.url),
      {
        type: 'module',
      },
    )
    selfWorker.postMessage('nested')
    selfWorker.addEventListener('message', (e) => {
      self.postMessage(e.data)
    })
  }

  self.postMessage(`pong: ${e.data}`)
})
