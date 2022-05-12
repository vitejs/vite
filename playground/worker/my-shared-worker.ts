let count = 0
const ports = new Set()

// @ts-expect-error
onconnect = (event) => {
  const port = event.ports[0]
  ports.add(port)
  port.postMessage(count)
  port.onmessage = (message) => {
    if (message.data === 'tick') {
      count++
      ports.forEach((p: any) => {
        p.postMessage(count)
      })
    }
  }
}

// for sourcemap
console.log('my-shared-worker.js')

export {}
