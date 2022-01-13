import { msg as originalMsg, mode } from './workerImport'
import { bundleWithPlugin } from './test-plugin'

let msg = originalMsg

self.onmessage = (e) => {
  if (e.data === 'ping') {
    self.postMessage({ msg, mode, bundleWithPlugin })
  }
}

if (import.meta.hot) {
  import.meta.hot.accept()
  import.meta.hot.accept('./workerImport', (newImportModule) => {
    if (newImportModule && newImportModule.msg) msg = newImportModule.msg
    else console.log(`Unexpected HMR received: ${newImportModule}`)
  })
}
