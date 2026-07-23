const msg: string = 'factory-ts-worker-pong'
self.onmessage = () => {
  self.postMessage(msg)
}
