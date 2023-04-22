import { mode, msg } from './modules/workerImport'

self.onmessage = (e) => {
  self.postMessage({ msg, mode })
}

self.postMessage({ msg, mode })

// for sourcemap
console.log('possible-ts-output-worker.mjs')
