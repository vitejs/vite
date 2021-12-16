import constant from './module'

// the comment to make this file not to be base64
/*************************************************************************************/
const ports = new Set()

self.onconnect = (event) => {
  const port = event.ports[0]
  ports.add(port)
  port.postMessage(constant)
}
