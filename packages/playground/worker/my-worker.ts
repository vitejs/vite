import { msg, mode } from './workerImport'
import { bundleWithPlugin } from './test-plugin'

self.onmessage = (e) => {
  if (e.data === 'ping') {
    self.postMessage({ msg, mode, bundleWithPlugin })
  }
}
