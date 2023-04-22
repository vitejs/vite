let sharedWorkerCount = 0

// @ts-expect-error onconnect exists in worker
self.onconnect = (event) => {
  sharedWorkerCount++
  const port = event.ports[0]
  if (sharedWorkerCount >= 2) {
    port.postMessage('pong')
  }
}

// for sourcemap
console.log('my-shared-worker.js')
