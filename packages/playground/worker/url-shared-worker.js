import constant from './modules/module'

self.onconnect = (event) => {
  const port = event.ports[0]
  port.postMessage(constant)
}
