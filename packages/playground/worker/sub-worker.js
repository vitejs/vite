self.onmessage = (event) => {
  if (event.data === 'ping') {
    self.postMessage(`pong ${self.location.href}`)
  }
}

// for sourcemap
console.log('sub-worker.js')
