import { msg, mode } from './modules/workerImport'
import { bundleWithPlugin } from './modules/test-plugin'

self.onmessage = (e) => {
  if (e.data === 'ping') {
    self.postMessage({ msg, mode, bundleWithPlugin })
  }
}

// for sourcemap
console.log('my-worker.js')
