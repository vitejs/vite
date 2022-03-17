importScripts(`${self.location.origin}/classic.js`)

self.addEventListener('message', () => {
  self.postMessage(self.constant)
})
