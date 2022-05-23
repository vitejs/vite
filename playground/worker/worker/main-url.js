import workerUrl from '../simple-worker?worker&url'

function text(el, text) {
  document.querySelector(el).textContent = text
}

const worker = new Worker(workerUrl, { type: 'module' })

worker.addEventListener('message', (ev) => {
  text('.simple-worker-url', JSON.stringify(ev.data))
})
