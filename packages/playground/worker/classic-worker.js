// prettier-ignore
function text(el, text) {
  document.querySelector(el).textContent = text
}

let classicWorker = new Worker(
  new URL('./newUrl/classic-worker.js', import.meta.url) /* , */  ,
  // test comment

)

// just test for case: ') ... ,' mean no worker options parmas
classicWorker = new Worker(new URL('./newUrl/classic-worker.js', import.meta.url))

classicWorker.addEventListener('message', ({ data }) => {
  text('.classic-worker', data)
})
classicWorker.postMessage('ping')

const classicSharedWorker = new SharedWorker(
  new URL('./newUrl/classic-shared-worker.js', import.meta.url),
  {
    type: 'classic'
  }
)
classicSharedWorker.port.addEventListener('message', (ev) => {
  text(
    '.classic-shared-worker',
    ev.data
  )
})
classicSharedWorker.port.start()
