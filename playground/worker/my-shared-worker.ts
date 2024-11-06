const ports = new Set()

let sharedWorkerCount = 0

// @ts-expect-error onconnect exists in worker
self.onconnect = (event) => {
  sharedWorkerCount++
  const port = event.ports[0]
  ports.add(port)
  if (sharedWorkerCount >= 2) {
    port.postMessage('pong')
  }
}

if (import.meta.hot) {
  import.meta.hot.accept((data) => {
    const message = data && data.message
    if (message) {
      ports.forEach((p: any) => {
        p.postMessage(`HMR pong: ${message}`)
      })
    }
  })
}

// for sourcemap
console.log('my-shared-worker.js')
