const worker = new Worker(
  new URL('../deeply-nested-worker.js', import.meta.url),
  { type: 'module' },
)

function text(el, text) {
  document.querySelector(el).textContent = text
}

worker.addEventListener('message', (ev) => {
  if (ev.data.type === 'deeplyNestedSecondWorker') {
    text('.deeply-nested-second-worker', JSON.stringify(ev.data.data))
  } else if (ev.data.type === 'deeplyNestedThirdWorker') {
    text('.deeply-nested-third-worker', JSON.stringify(ev.data.data))
  } else {
    text('.deeply-nested-worker', JSON.stringify(ev.data.data))
  }
})
