import { url } from '../simple-worker?worker'

function text(el, text) {
  document.querySelector(el).textContent = text
}

const worker = new Worker(url, { type: 'module' })

worker.addEventListener('message', (ev) => {
  text('.simple-worker-url', JSON.stringify(ev.data))
})
