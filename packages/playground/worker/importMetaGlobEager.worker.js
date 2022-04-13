const modules = import.meta.globEager('./modules/*js')

self.onmessage = function (e) {
  self.postMessage(Object.keys(modules))
}

// for sourcemap
console.log('importMetaGlobEager.worker.js')
