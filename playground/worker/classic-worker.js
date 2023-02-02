const base = ''

importScripts(`${base}/classic.js`)

self.addEventListener('message', () => {
  self.postMessage(self.constant)
})

// for sourcemap
console.log("classic-worker.js")
