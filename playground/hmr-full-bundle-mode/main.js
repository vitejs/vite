import './hmr.js'
import './hmr-asset.js'
import './invalidation-parent.js'
import './dead-accept.js'
import './cycle-a.js'
import assetUrl from './asset.png'
import WorkerQuery from './worker-query.js?worker'

text('.app', 'hello')
text('.asset', assetUrl)

const workerQuery = new WorkerQuery()
workerQuery.postMessage('ping')
workerQuery.addEventListener('message', (e) => {
  text('.worker-query', e.data)
})

const workerUrl = new Worker(new URL('./worker-url.js', import.meta.url), {
  type: 'module',
})
workerUrl.postMessage('ping')
workerUrl.addEventListener('message', (e) => {
  text('.worker-url', e.data)
})

const workerPlain = new Worker(new URL('./worker-plain.js', import.meta.url), {
  type: 'module',
})
workerPlain.postMessage('ping')
workerPlain.addEventListener('message', (e) => {
  text('.worker-plain', e.data)
})

document.querySelector('#load-dynamic').addEventListener('click', () => {
  import('./dynamic.js')
})

import.meta.hot?.accept('./cycle-a.js', () => {})

function text(el, text) {
  document.querySelector(el).textContent = text
}
