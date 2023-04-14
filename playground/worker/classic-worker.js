let base = `/${self.location.pathname.split('/')[1]}`
if (base.endsWith('.js') || base === `/worker-entries`) base = '' // for dev

importScripts(`${base}/classic.js`)

self.addEventListener('message', () => {
  self.postMessage(self.constant)
})

// for sourcemap
console.log("classic-worker.js")
