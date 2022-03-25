// run when format es
import NestedWorker from '../emit-chunk-nested-worker?worker'

function text(el, text) {
  document.querySelector(el).textContent = text
}

text('.format-es', 'format es:')

const nestedWorker = new NestedWorker()
nestedWorker.addEventListener('message', (ev) => {
  text('.emti-chunk-worker', JSON.stringify(ev.data))
})

const dynamicImportWorker = new Worker(
  new URL('../emit-chunk-dynamic-import-worker.js', import.meta.url),
  {
    type: 'module'
  }
)
dynamicImportWorker.addEventListener('message', (ev) => {
  text('.emti-chunk-dynamic-import-worker', JSON.stringify(ev.data))
})
