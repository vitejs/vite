importScripts('/classic.js')

self.addEventListener('message', () => {
  self.postMessage(self.constant)
})
