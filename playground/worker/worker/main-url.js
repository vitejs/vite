import workerUrl from '../simple-worker?worker&url'

function text(el, text) {
  document.querySelector(el).textContent = text
}

const worker = new Worker(workerUrl, { type: 'module' })

worker.addEventListener('message', (ev) => {
  text('.simple-worker-url', JSON.stringify(ev.data))
})

if (import.meta.hot) {
  import.meta.hot.accept()
  import.meta.hot.accept('../simple-worker?worker&url', () => {
    console.log('../simple-worker?worker&url changed')
  })
}
