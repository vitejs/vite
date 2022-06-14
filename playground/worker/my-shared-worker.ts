const ports = new Set()

// @ts-expect-error
self.onconnect = (event) => {
  const port = event.ports[0]
  ports.add(port)
  port.postMessage('pong')
  port.onmessage = () => {
    ports.forEach((p: any) => {
      p.postMessage('pong')
    })
  }
}

// for sourcemap
console.log('my-shared-worker.js')
