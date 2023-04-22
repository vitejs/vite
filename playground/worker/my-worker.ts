import { msg as msgFromDep } from '@vitejs/test-dep-to-optimize'
import { mode, msg } from './modules/workerImport.js'
import { bundleWithPlugin } from './modules/test-plugin'
import viteSvg from './vite.svg'

self.onmessage = (e) => {
  if (e.data === 'ping') {
    self.postMessage({ msg, mode, bundleWithPlugin, viteSvg })
  }
}
self.postMessage({ msg, mode, bundleWithPlugin, msgFromDep, viteSvg })

// for sourcemap
console.log('my-worker.js')
