import { msg } from './workerImport'

self.onmessage = (e) => {
  if (e.data === 'ping') {
    self.postMessage(msg)
  }
}
