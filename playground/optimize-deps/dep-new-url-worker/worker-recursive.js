self.addEventListener('message', (e) => {
  if (e.data === 'main') {
    const nested = new Worker(
      new URL('./worker-recursive.js', import.meta.url),
      {
        type: 'module',
      },
    )
    nested.postMessage('nested')
    nested.addEventListener('message', (e) => {
      self.postMessage(e.data)
    })
  } else {
    self.postMessage({ ok: true })
  }
})
