import constant from './modules/module0'

self.onconnect = (event) => {
  const port = event.ports[0]
  port.postMessage(constant)
}
