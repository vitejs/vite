self.onmessage = (event) => {
  if (event.data === 'ping') {
    self.postMessage(`pong ${import.meta.url}`)
  }
}
