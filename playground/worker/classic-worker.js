let base = `/${self.location.pathname.split('/')[1]}`
if (base === `/worker-entries`) base = '' // relative base

importScripts(`${base}/classic.js`)

self.addEventListener('message', () => {
  self.postMessage(self.constant)
})

// for sourcemap
console.log("classic-worker.js")
