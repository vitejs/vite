import myWorker from '../my-worker.ts?worker'
import InlineWorker from '../my-worker.ts?worker&inline'
import InlineSharedWorker from '../my-inline-shared-worker?sharedworker&inline'
import mySharedWorker from '../my-shared-worker?sharedworker&name=shared'
import TSOutputWorker from '../possible-ts-output-worker?worker'
import NestedWorker from '../worker-nested-worker?worker'
import { mode } from '../modules/workerImport'
import SelfReferenceWorker from '../self-reference-worker?worker'

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
  text('.asset-url', e.data.viteSvg)
})

const namedWorker = new myWorker({ name: 'namedWorker' })
namedWorker.postMessage('ping')
namedWorker.addEventListener('message', (e) => {
  text('.pong-named', e.data.name)
})

const inlineWorker = new InlineWorker()
inlineWorker.postMessage('ping')
inlineWorker.addEventListener('message', (e) => {
  text('.pong-inline', e.data.msg)
})

const namedInlineWorker = new InlineWorker({ name: 'namedInlineWorker' })
namedInlineWorker.postMessage('ping')
namedInlineWorker.addEventListener('message', (e) => {
  text('.pong-inline-named', e.data.name)
})

const inlineWorkerUrl = new InlineWorker()
inlineWorkerUrl.postMessage('ping')
inlineWorkerUrl.addEventListener('message', (e) => {
  text('.pong-inline-url', e.data.metaUrl)
})

const unicodeInlineWorker = new InlineWorker()
unicodeInlineWorker.postMessage('ping-unicode')
unicodeInlineWorker.addEventListener('message', (e) => {
  text('.pong-inline-unicode', e.data.msg)
})

const startSharedWorker = () => {
  const sharedWorker = new mySharedWorker()
  sharedWorker.port.addEventListener('message', (event) => {
    text('.tick-count', event.data)
  })
  sharedWorker.port.start()
}
startSharedWorker()
startSharedWorker()

const startNamedSharedWorker = () => {
  const sharedWorker = new mySharedWorker({ name: 'namedSharedWorker' })
  sharedWorker.port.addEventListener('message', (event) => {
    text('.tick-count-named', event.data)
  })
  sharedWorker.port.start()
}
startNamedSharedWorker()
startNamedSharedWorker()

const startInlineSharedWorker = () => {
  const inlineSharedWorker = new InlineSharedWorker()
  inlineSharedWorker.port.addEventListener('message', (event) => {
    text('.pong-shared-inline', event.data)
  })
  inlineSharedWorker.port.start()
}

startInlineSharedWorker()
startInlineSharedWorker()

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
  /* @vite-ignore */ workerOptions,
)
w.addEventListener('message', (ev) =>
  text('.worker-import-meta-url', JSON.stringify(ev.data)),
)

// url import worker with alias path
const wResolve = new Worker(
  new URL('@/url-worker.js', import.meta.url),
  /* @vite-ignore */ workerOptions,
)
wResolve.addEventListener('message', (ev) =>
  text('.worker-import-meta-url-resolve', JSON.stringify(ev.data)),
)

// url import worker without extension
const wWithoutExt = new Worker(
  new URL('../url-worker', import.meta.url),
  /* @vite-ignore */ workerOptions,
)
wWithoutExt.addEventListener('message', (ev) =>
  text('.worker-import-meta-url-without-extension', JSON.stringify(ev.data)),
)

const genWorkerName = () => 'module'
const w2 = new SharedWorker(
  new URL('../url-shared-worker.js', import.meta.url),
  {
    /* @vite-ignore */
    name: genWorkerName(),
    type: 'module',
  },
)
w2.port.addEventListener('message', (ev) => {
  text('.shared-worker-import-meta-url', JSON.stringify(ev.data))
})
w2.port.start()

const workers = import.meta.glob('../importMetaGlobEager.*.js', {
  query: '?worker',
  eager: true,
})
const importMetaGlobEagerWorker = new workers[
  '../importMetaGlobEager.worker.js'
].default()
importMetaGlobEagerWorker.postMessage('1')
importMetaGlobEagerWorker.addEventListener('message', (e) => {
  text('.importMetaGlobEager-worker', JSON.stringify(e.data))
})

const selfReferenceWorker = new SelfReferenceWorker()
selfReferenceWorker.postMessage('main')
selfReferenceWorker.addEventListener('message', (e) => {
  document.querySelector('.self-reference-worker').textContent += `${e.data}\n`
})

const selfReferenceUrlWorker = new Worker(
  new URL('../self-reference-url-worker.js', import.meta.url),
  {
    type: 'module',
  },
)
selfReferenceUrlWorker.postMessage('main')
selfReferenceUrlWorker.addEventListener('message', (e) => {
  document.querySelector('.self-reference-url-worker').textContent +=
    `${e.data}\n`
})
