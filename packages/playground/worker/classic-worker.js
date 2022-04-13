importScripts(`/${self.location.pathname.split("/")[1]}/classic.js`)

self.addEventListener('message', () => {
  self.postMessage(self.constant)
})

// for sourcemap
console.log("classic-worker.js")
