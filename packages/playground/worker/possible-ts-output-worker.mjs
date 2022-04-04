import { msg, mode } from './modules/workerImport'

self.onmessage = (e) => {
  if (e.data === 'ping') {
    self.postMessage({ msg, mode })
  }
}
