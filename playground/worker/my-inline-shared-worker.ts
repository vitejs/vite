let inlineSharedWorkerCount = 0

// @ts-expect-error onconnect exists in worker
self.onconnect = (event) => {
  inlineSharedWorkerCount++
  const port = event.ports[0]
  if (inlineSharedWorkerCount >= 2) {
    port.postMessage('pong')
  }
}

// for sourcemap
console.log('my-inline-shared-worker.js')
