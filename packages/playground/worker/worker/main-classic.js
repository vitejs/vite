// prettier-ignore
function text(el, text) {
  document.querySelector(el).textContent = text
}

let classicWorker = new Worker(
  new URL('../classic-worker.js', import.meta.url) /* , */
  // test comment
)

// just test for case: ') ... ,' mean no worker options parmas
classicWorker = new Worker(new URL('../classic-worker.js', import.meta.url))

classicWorker.addEventListener('message', ({ data }) => {
  text('.classic-worker', JSON.stringify(data))
})
classicWorker.postMessage('ping')

const classicSharedWorker = new SharedWorker(
  new URL('../classic-shared-worker.js', import.meta.url),
  {
    type: 'classic'
  }
)
classicSharedWorker.port.addEventListener('message', (ev) => {
  text('.classic-shared-worker', JSON.stringify(ev.data))
})
classicSharedWorker.port.start()
