import ImportMetaGlobEagerWorker from './importMetaGlobEager.worker?worker'
import SubWorker from './sub-worker?worker'
import { state } from './modules/test-state.js'

self.postMessage({
  type: 'plugin-state',
  data: state,
})

const subWorker = new SubWorker()

self.onmessage = (event) => {
  if (event.data === 'ping') {
    subWorker.postMessage('ping')
  }
}

self.postMessage(self.location.href)

subWorker.onmessage = (ev) => {
  self.postMessage(ev.data)
}

const classicWorker = new Worker(new URL('./url-worker.js', import.meta.url), {
  type: 'module',
})
classicWorker.addEventListener('message', (ev) => {
  self.postMessage({
    type: 'constructor',
    data: ev.data,
  })
})

const importMetaGlobEagerWorker = new ImportMetaGlobEagerWorker()

importMetaGlobEagerWorker.postMessage('1')

importMetaGlobEagerWorker.addEventListener('message', (ev) => {
  self.postMessage({
    type: 'importMetaGlobEager',
    data: ev.data,
  })
})

// for sourcemap
console.log('worker-nested-worker.js')
