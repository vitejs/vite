// Worker for testing template literal paths with import.meta.env
self.onmessage = (e) => {
  console.log('env-path-worker received:', e.data)
  self.postMessage({ pong: 'from-env-path-worker' })
}
