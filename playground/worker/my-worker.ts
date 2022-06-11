import { mode, msg } from './modules/workerImport'
import { bundleWithPlugin } from './modules/test-plugin'

self.onmessage = () => {
  self.postMessage({ msg, mode, bundleWithPlugin })
}
self.postMessage({ msg, mode, bundleWithPlugin })

// for sourcemap
console.log('my-worker.js')
