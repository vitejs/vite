const inner = new Worker(new URL('./worker-nested-inner.js', import.meta.url), {
  type: 'module',
})

self.onmessage = () => {
  inner.postMessage('ping')
}
inner.onmessage = (e) => {
  self.postMessage(`nested-outer+${e.data}`)
}
inner.onerror = () => {
  self.postMessage('nested-inner-error')
}
