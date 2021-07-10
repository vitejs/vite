let count = 0
const ports = new Set()

onconnect = (event) => {
  const port = event.ports[0]
  ports.add(port)
  port.postMessage(count)
  port.onmessage = (message) => {
    if (message.data === 'tick') {
      count++
      ports.forEach((p) => {
        p.postMessage(count)
      })
    }
  }
}
