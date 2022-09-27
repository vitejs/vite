const ports = new Set()

export let message = 'hey there'

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
