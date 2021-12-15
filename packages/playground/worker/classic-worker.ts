self.onmessage = (e) => {
  if (e.data === 'ping') {
    self.postMessage('pong')
  }
}
