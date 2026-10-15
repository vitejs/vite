const msg = 'worker-accept'

self.onmessage = (e) => {
  if (e.data === 'ping') {
    self.postMessage(msg)
  }
}
