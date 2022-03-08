self.onmessage = (event) => {
  if (event.data === 'ping') {
    self.postMessage('pong')
  }
}
const data = import('./workerImport')
data.then((data) => {
  const { mode, msg } = data
  self.postMessage({
    mode,
    msg
  })
})
