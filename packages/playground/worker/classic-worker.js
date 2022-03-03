// prettier-ignore
function text(el, text) {
  document.querySelector(el).textContent = text
}

const classicWorker = new Worker(
  new URL('./newUrl/classic-worker.js', import.meta.url) /* , */  ,
  // test comment

)

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
