import { msg as msgFromDep } from 'dep-to-optimize'
import { mode, msg } from './modules/workerImport'
import { bundleWithPlugin } from './modules/test-plugin'
// import { msg as msgFromDep } from 'dep-to-optimize'

self.onmessage = (e) => {
  if (e.data === 'ping') {
    self.postMessage({ msg, mode, bundleWithPlugin }) // TODO: fix darwin, and add back: msgFromDep })
  }
}
self.postMessage({ msg, mode, bundleWithPlugin, msgFromDep })

// for sourcemap
console.log('my-worker.js')
