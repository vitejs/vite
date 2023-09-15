import ImportMetaGlobEagerWorker from './importMetaGlobEager.worker?worker'
import SubWorker from './sub-worker?worker'
import SubWorker2 from './sub-worker?worker&inline'

const subWorker = new SubWorker()
const subWorker2 = new SubWorker2()

self.onmessage = (event) => {
  if (event.data === 'ping') {
    subWorker.postMessage('ping')
    subWorker2.postMessage('ping')
  }
}

self.postMessage(self.location.href)

subWorker.onmessage = (ev) => {
  self.postMessage({
    type: 'module',
    data: ev.data,
  })
}

subWorker2.onmessage = (ev) => {
  self.postMessage({
    type: 'inline',
    data: ev.data,
  })
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
