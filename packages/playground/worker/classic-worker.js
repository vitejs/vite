// prettier-ignore
function text(el, text) {
  document.querySelector(el).textContent = text
}

const classicWorker = new Worker(
  new URL('./newUrl/classic-worker.js', import.meta.url)   ,
  // test comment

)

classicWorker.addEventListener('message', ({ data }) => {
  text('.classic-worker', data)
})
classicWorker.postMessage('ping')
