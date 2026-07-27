// A worker that spawns another worker. The inner one is bundled separately and
// never appears in this bundle's `referencedAssets`, so it is only served if
// every known worker file is emitted, not just the one being resolved.
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
