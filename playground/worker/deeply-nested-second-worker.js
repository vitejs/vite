self.postMessage({
  type: 'deeplyNestedSecondWorker',
  data: [
    'Hello from second level nested worker',
    import.meta.env.BASE_URL,
    self.location.url,
    import.meta.url,
  ].join(' '),
})

const deeplyNestedThirdWorker = new Worker(
  new URL('deeply-nested-third-worker.js', import.meta.url),
  { type: 'module' },
)
deeplyNestedThirdWorker.addEventListener('message', (ev) => {
  self.postMessage(ev.data)
})

console.log('deeply-nested-second-worker.js')
