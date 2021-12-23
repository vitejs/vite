import { msg, mode } from './workerImport'
import './test-plugin'

self.onmessage = (e) => {
  if (e.data === 'ping') {
    self.postMessage({ msg, mode })
  }
}
