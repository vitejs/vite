// prettier-ignore
function text(el, text) {
  document.querySelector(el).textContent = text
}

let classicWorker = new Worker(
  new URL('../classic-worker.js', import.meta.url) /* , */,
  // test comment
)

// just test for case: ') ... ,' mean no worker options params
classicWorker = new Worker(new URL('../classic-worker.js', import.meta.url))

classicWorker.addEventListener('message', ({ data }) => {
  switch (data.message) {
    case 'ping': {
      text('.classic-worker', data.result)
      break
    }
    case 'test-import': {
      text('.classic-worker-import', data.result)
      break
    }
  }
})
classicWorker.postMessage('ping')
classicWorker.postMessage('test-import')

// prettier-ignore
// test trailing comma
const classicSharedWorker = new SharedWorker(
  new URL('../classic-shared-worker.js', import.meta.url),
  {
    type: 'classic'
  }, // test comment
)
classicSharedWorker.port.addEventListener('message', (ev) => {
  text('.classic-shared-worker', JSON.stringify(ev.data))
})
classicSharedWorker.port.start()
