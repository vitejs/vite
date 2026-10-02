import emittedWorkerUrl from 'virtual:emitted-worker-url'

function text(el, text) {
  document.querySelector(el).textContent = text
}
text('.relative-js', 'hello')

if (emittedWorkerUrl) {
  text('.emitted-worker-url', emittedWorkerUrl)
  const worker = new Worker(emittedWorkerUrl, { type: 'module' })
  worker.addEventListener('message', ({ data }) => {
    text('.emitted-worker-result', data)
  })
}
