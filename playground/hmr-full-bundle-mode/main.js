import './hmr.js'
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

function text(el, text) {
  document.querySelector(el).textContent = text
}
