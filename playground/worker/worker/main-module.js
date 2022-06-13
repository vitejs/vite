import myWorker from '../my-worker?worker'
import InlineWorker from '../my-worker?worker&inline'
import mySharedWorker from '../my-shared-worker?sharedworker&name=shared'
import TSOutputWorker from '../possible-ts-output-worker?worker'
import NestedWorker from '../worker-nested-worker?worker'
import { mode } from '../modules/workerImport'

function text(el, text) {
  document.querySelector(el).textContent = text
}

document.querySelector('.mode-true').textContent = mode

const worker = new myWorker()
worker.postMessage('ping')
worker.addEventListener('message', (e) => {
  text('.pong', e.data.msg)
  text('.mode', e.data.mode)
  text('.bundle-with-plugin', e.data.bundleWithPlugin)
})

const inlineWorker = new InlineWorker()
inlineWorker.postMessage('ping')
inlineWorker.addEventListener('message', (e) => {
  text('.pong-inline', e.data.msg)
})

const sharedWorker = new mySharedWorker()
sharedWorker.port.addEventListener('message', (event) => {
  text('.tick-count', event.data)
})
sharedWorker.port.start()

const tsOutputWorker = new TSOutputWorker()
tsOutputWorker.postMessage('ping')
tsOutputWorker.addEventListener('message', (e) => {
  text('.pong-ts-output', e.data.msg)
})

const nestedWorker = new NestedWorker()
nestedWorker.addEventListener('message', (ev) => {
  if (typeof ev.data === 'string') {
    text('.nested-worker', JSON.stringify(ev.data))
  } else if (typeof ev.data === 'object') {
    const data = ev.data
    if (data.type === 'module') {
      text('.nested-worker-module', JSON.stringify(ev.data))
    } else if (data.type === 'constructor') {
      text('.nested-worker-constructor', JSON.stringify(ev.data))
    } else if (data.type === 'importMetaGlobEager') {
      text('.importMetaGlobEager-worker', JSON.stringify(ev.data))
    }
  }
})
nestedWorker.postMessage('ping')

const workerOptions = { type: 'module' }
// url import worker
const w = new Worker(
  new URL('../url-worker.js', import.meta.url),
  /* @vite-ignore */ workerOptions
)
w.addEventListener('message', (ev) =>
  text('.worker-import-meta-url', JSON.stringify(ev.data))
)

const genWorkerName = () => 'module'
const w2 = new SharedWorker(
  new URL('../url-shared-worker.js', import.meta.url),
  {
    /* @vite-ignore */
    name: genWorkerName(),
    type: 'module'
  }
)
w2.port.addEventListener('message', (ev) => {
  text('.shared-worker-import-meta-url', JSON.stringify(ev.data))
})
w2.port.start()
