import InlineWorker from '../my-worker?worker&inline'
import myWorker from '../my-worker?worker'
function text(el, text) {
  document.querySelector(el).textContent = text
}

const inlineWorker = new InlineWorker()
inlineWorker.postMessage('ping')
inlineWorker.addEventListener('message', (e) => {
  text('.pong-inline', e.data.msg)
})

const worker = new myWorker()
worker.postMessage('ping')
worker.addEventListener('message', (e) => {
  text('.pong', e.data.msg)
  text('.mode', e.data.mode)
  text('.bundle-with-plugin', e.data.bundleWithPlugin)
})
