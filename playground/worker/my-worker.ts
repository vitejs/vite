import { msg as msgFromDep } from 'dep-to-optimize'
import { mode, msg } from './modules/workerImport'
import { bundleWithPlugin } from './modules/test-plugin'

self.onmessage = (e) => {
  if (e.data === 'ping') {
    self.postMessage({ msg, mode, bundleWithPlugin })
  }
}
self.postMessage({ msg, mode, bundleWithPlugin, msgFromDep })

// for sourcemap
console.log('my-worker.js')
