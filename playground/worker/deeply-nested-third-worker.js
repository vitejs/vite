self.postMessage({
  type: 'deeplyNestedThirdWorker',
  data: [
    'Hello from third level nested worker',
    import.meta.env.BASE_URL,
    self.location.url,
    import.meta.url,
  ].join(' '),
})

console.log('deeply-nested-third-worker.js')
