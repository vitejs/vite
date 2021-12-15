import { msg, mode } from './workerImport'

self.onmessage = (e) => {
  if (e.data === 'ping') {
    self.postMessage({ msg, mode })
  }
}
