self.postMessage({
  type: 'deeplyNestedWorker',
  data: [
    'Hello from root worker',
    import.meta.env.BASE_URL,
    self.location.url,
    import.meta.url,
  ].join(' '),
})

const deeplyNestedSecondWorker = new Worker(
  new URL('deeply-nested-second-worker.js', import.meta.url),
  { type: 'module' },
)
deeplyNestedSecondWorker.addEventListener('message', (ev) => {
  self.postMessage(ev.data)
})

console.log('deeply-nested-worker.js')
